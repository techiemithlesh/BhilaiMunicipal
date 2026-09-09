<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>

<body>
  <h3>
    {{$details["title"]??"Forgot Password"}}
  </h3>
  <p>
    Dear {{$details["name"]??"Gust"}}<br>
    Your OTP is {{$details["Otp"]}}. Please do not share this with anyone. This OTP is valid for 10 minutes.<br>
    If you did not request this, please ignore this email.
    <br><br><br>
    Thank you, Ranchi Municipal Corporation Team
  </p>
</body>

</html>