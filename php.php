<?php
$services = [
    'AC Repair',
    'Refrigerator Repair',
    'Washing Machine Repair',
    'Home Appliance Inspection',
    'Electrical Repair'
];

$selectedService = '';
$name = '';
$email = '';
$phone = '';
$address = '';
$date = '';
$time = '';
$message = '';
$paymentMethod = '';
$bookingConfirmed = false;
$bookingSummary = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $selectedService = htmlspecialchars($_POST['service'] ?? '');
    $name = htmlspecialchars($_POST['name'] ?? '');
    $email = htmlspecialchars($_POST['email'] ?? '');
    $phone = htmlspecialchars($_POST['phone'] ?? '');
    $address = htmlspecialchars($_POST['address'] ?? '');
    $date = htmlspecialchars($_POST['date'] ?? '');
    $time = htmlspecialchars($_POST['time'] ?? '');
    $message = htmlspecialchars($_POST['message'] ?? '');
    $paymentMethod = htmlspecialchars($_POST['payment_method'] ?? '');

    if ($selectedService && $name && $email && $phone && $address && $date && $time && $paymentMethod) {
        $bookingConfirmed = true;
        $bookingSummary = "Thank you, $name! Your booking for $selectedService is confirmed. " .
            "We will contact you at $phone or $email to finalize the appointment. " .
            "Payment method: " . ($paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment') . ".";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Dynamic Interface | G care</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="logo">G <span>care</span></div>
            <ul class="nav-links">
                <li><a href="index.html">Home</a></li>
                <li><a href="index.html#services">Services</a></li>
                <li><a href="index.html#booking">Booking</a></li>
                <li><a href="php.php" class="active">PHP Demo</a></li>
            </ul>
            <div class="nav-auth">
                <a href="login.html" class="btn-login-nav">Login</a>
                <a href="signup.html" class="btn-signup-nav">Sign Up</a>
            </div>
        </div>
    </nav>

    <main class="php-interface-page">
        <section class="container php-interface-content">
            <div class="section-title">
                <h2>PHP Dynamic Booking Interface</h2>
                <p>Use this PHP-powered page to submit a booking interactively and choose your payment method.</p>
            </div>

            <?php if ($bookingConfirmed): ?>
                <div class="booking-confirmation-box">
                    <h3>Booking Confirmed!</h3>
                    <p><?php echo $bookingSummary; ?></p>
                    <a href="index.html" class="btn-primary btn-full">Return to Home</a>
                </div>
            <?php else: ?>
                <form method="post" class="php-booking-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="service">Select Service</label>
                            <select id="service" name="service" required>
                                <option value="">Choose a service</option>
                                <?php foreach ($services as $service): ?>
                                    <option value="<?php echo $service; ?>" <?php echo $selectedService === $service ? 'selected' : ''; ?>><?php echo $service; ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="name">Full Name</label>
                            <input id="name" name="name" type="text" value="<?php echo $name; ?>" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input id="email" name="email" type="email" value="<?php echo $email; ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <input id="phone" name="phone" type="tel" value="<?php echo $phone; ?>" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="address">Address</label>
                            <input id="address" name="address" type="text" value="<?php echo $address; ?>" required>
                        </div>
                        <div class="form-group">
                            <label for="date">Preferred Date</label>
                            <input id="date" name="date" type="date" value="<?php echo $date; ?>" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="time">Time Slot</label>
                            <select id="time" name="time" required>
                                <option value="">Choose a time</option>
                                <option value="morning" <?php echo $time === 'morning' ? 'selected' : ''; ?>>Morning (9AM - 12PM)</option>
                                <option value="afternoon" <?php echo $time === 'afternoon' ? 'selected' : ''; ?>>Afternoon (12PM - 4PM)</option>
                                <option value="evening" <?php echo $time === 'evening' ? 'selected' : ''; ?>>Evening (4PM - 8PM)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="payment_method">Payment Option</label>
                            <select id="payment_method" name="payment_method" required>
                                <option value="">Choose a payment method</option>
                                <option value="cod" <?php echo $paymentMethod === 'cod' ? 'selected' : ''; ?>>Cash on Delivery</option>
                                <option value="online" <?php echo $paymentMethod === 'online' ? 'selected' : ''; ?>>Online Payment</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="message">Additional Notes</label>
                        <textarea id="message" name="message" rows="4"><?php echo $message; ?></textarea>
                    </div>
                    <button type="submit" class="btn-primary btn-full">Submit PHP Booking</button>
                </form>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>
