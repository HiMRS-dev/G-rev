using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Script.Serialization;

public sealed class GuitarLeadHandler : IHttpHandler
{
    private static readonly JavaScriptSerializer Serializer = new JavaScriptSerializer();
    private static readonly Regex NamePattern = new Regex(
        @"^[A-Za-zА-Яа-яЁё\s-]{1,100}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex PhonePattern = new Regex(
        @"^[0-9+\-()\s]{7,32}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.TrySkipIisCustomErrors = true;
        context.Response.ContentType = "application/json; charset=utf-8";

        if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
        {
            WriteError(context, 405, "Method not allowed");
            return;
        }

        string body;
        using (var reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))
        {
            body = reader.ReadToEnd();
        }

        if (body.Length == 0 || body.Length > 65536)
        {
            WriteError(context, 400, "Invalid request");
            return;
        }

        Dictionary<string, object> payload;
        try
        {
            payload = Serializer.DeserializeObject(body) as Dictionary<string, object>;
        }
        catch
        {
            payload = null;
        }

        if (payload == null)
        {
            WriteError(context, 400, "Invalid request");
            return;
        }

        var name = GetString(payload, "name").Trim();
        var phone = GetString(payload, "phone").Trim();
        var email = GetString(payload, "email").Trim();
        var ageText = GetString(payload, "age").Trim();
        object consentValue;
        var consent = payload.TryGetValue("consent", out consentValue)
            && consentValue is bool
            && (bool)consentValue;

        int age;

        if (!NamePattern.IsMatch(name) || !PhonePattern.IsMatch(phone)
            || !int.TryParse(ageText, NumberStyles.Integer, CultureInfo.InvariantCulture, out age)
            || age < 1 || age > 120 || !consent
            || (!string.IsNullOrEmpty(email) && !IsValidEmail(email)))
        {
            WriteError(context, 400, "Invalid request");
            return;
        }

        var id = Guid.NewGuid().ToString("N");
        var pendingDirectory = Environment.GetEnvironmentVariable("GUITAR_LEAD_DATA_DIR");
        if (string.IsNullOrWhiteSpace(pendingDirectory))
        {
            pendingDirectory = @"C:\ProgramData\guitarLending\leads\pending";
        }

        Directory.CreateDirectory(pendingDirectory);
        var record = new Dictionary<string, object>();
        record["id"] = id;
        record["name"] = name;
        record["phone"] = phone;
        record["age"] = age;
        record["email"] = email;
        record["consent"] = true;
        record["received_at"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture);
        var pendingPath = Path.Combine(pendingDirectory, id + ".json");
        File.WriteAllText(pendingPath, Serializer.Serialize(record), new UTF8Encoding(false));

        var token = Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN");
        var chatId = Environment.GetEnvironmentVariable("TELEGRAM_CHAT_ID");
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(chatId))
        {
            WriteError(context, 503, "Lead delivery is not configured");
            return;
        }

        var message = BuildTelegramMessage(name, phone, age, email);
        if (!SendTelegram(token, chatId, message))
        {
            WriteError(context, 503, "Lead delivery failed");
            return;
        }

        var sentDirectory = Path.Combine(Directory.GetParent(pendingDirectory).FullName, "sent");
        Directory.CreateDirectory(sentDirectory);
        File.Move(pendingPath, Path.Combine(sentDirectory, id + ".json"));
        context.Response.StatusCode = 200;
        context.Response.Write(Serializer.Serialize(new { accepted = true, delivered = true, id }));
    }

    private static string GetString(Dictionary<string, object> payload, string key)
    {
        object value;
        return payload.TryGetValue(key, out value) && value != null
            ? Convert.ToString(value, CultureInfo.InvariantCulture) ?? string.Empty
            : string.Empty;
    }

    private static bool IsValidEmail(string email)
    {
        return email.Length <= 254
            && Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.CultureInvariant);
    }

    private static string BuildTelegramMessage(string name, string phone, int age, string email)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Новая заявка с сайта");
        builder.AppendLine("Имя: " + name);
        builder.AppendLine("Телефон: " + phone);
        builder.AppendLine("Возраст: " + age.ToString(CultureInfo.InvariantCulture));
        if (!string.IsNullOrEmpty(email))
        {
            builder.AppendLine("Email: " + email);
        }
        builder.Append("Согласие на обработку данных: да");
        return builder.ToString();
    }

    private static bool SendTelegram(string token, string chatId, string message)
    {
        try
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            using (var client = new WebClient())
            {
                client.Encoding = Encoding.UTF8;
                var values = new NameValueCollection();
                values["chat_id"] = chatId;
                values["text"] = message;
                values["disable_web_page_preview"] = "true";
                var response = client.UploadValues(
                    "https://api.telegram.org/bot" + token + "/sendMessage",
                    "POST",
                    values);
                var result = Serializer.DeserializeObject(Encoding.UTF8.GetString(response))
                    as Dictionary<string, object>;
                object ok;
                if (result != null
                    && result.TryGetValue("ok", out ok)
                    && ok is bool
                    && (bool)ok)
                {
                    return true;
                }

                WriteTelegramFailure("api-response");
                return false;
            }
        }
        catch (WebException exception)
        {
            var response = exception.Response as HttpWebResponse;
            var status = response == null
                ? "none"
                : ((int)response.StatusCode).ToString(CultureInfo.InvariantCulture);
            WriteTelegramFailure("web-exception-http-" + status);
            return false;
        }
        catch (Exception exception)
        {
            WriteTelegramFailure(exception.GetType().Name);
            return false;
        }
    }

    private static void WriteTelegramFailure(string reason)
    {
        try
        {
            var pendingDirectory = Environment.GetEnvironmentVariable("GUITAR_LEAD_DATA_DIR");
            if (string.IsNullOrWhiteSpace(pendingDirectory))
            {
                pendingDirectory = @"C:\ProgramData\guitarLending\leads\pending";
            }

            var parent = Directory.GetParent(pendingDirectory);
            if (parent == null)
            {
                return;
            }

            var path = Path.Combine(parent.FullName, "telegram-errors.log");
            var line = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture)
                + " " + reason + Environment.NewLine;
            File.AppendAllText(path, line, new UTF8Encoding(false));
        }
        catch
        {
            // Diagnostics must never change the response or expose secrets.
        }
    }

    private static void WriteError(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        context.Response.Write(Serializer.Serialize(new { error = message }));
    }
}
