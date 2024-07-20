const express = require("express");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Our server running on port 3000
const port = 3000;
app.listen(port, () => {
    console.log("Server is running on port 3000...");
});

// To create connection with MongoDB
main().then(() => {
    console.log("Connection Successful");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/BackendProject');
}

// Setting view engine to ejs
app.set("view engine", "ejs");

const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // To access public folder

// To parse data that we get from forms
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // To parse JSON bodies

// Root route
app.get("/", (req, res) => {
    res.send("Root is working");
});

// Show user data -> user route
app.get("/user", async (req, res) => {
    const users = await User.find({});
    const userData = users.map(user => ({
        PurchasePower: user.PurchasePower,
        PhoneNumber: user.PhoneNumber,
        Email: user.Email,
        RegistrationDate: user.RegistrationDate,
        DOB: user.DOB,
        MonthlySalary: user.MonthlySalary
    }));
    // res.json(userData);
    res.render("show.ejs", { userData });
});


// User signup page -> Signup route
app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});

// Create Route -> to create a new user
app.post("/signup", async (req, res) => {
    let { Name, Email, PhoneNumber, RegistrationDate, DOB, MonthlySalary, Password } = req.body;

    let dobDate = new Date(DOB);

    try {
        // convert password in  Hash password before saving it to the database
        let hashedPassword = await bcrypt.hash(Password, 10);

        let newUser = new User({
            Name: Name,
            Email: Email,
            PhoneNumber: PhoneNumber,
            RegistrationDate: RegistrationDate,
            DOB: dobDate,
            MonthlySalary: MonthlySalary,
            Password: hashedPassword,
            PurchasePower: 0 // Initialize PurchasePower to 0
        });

        let age = calculateAge(dobDate);

        if (age > 20) {
            await newUser.save();
            console.log("New user was saved");
            res.send("User Registered Successfully")
        } else {
            res.status(400).send("User must be above 20 years of age to register");
        }

    } catch (err) {
        console.log(err);
        res.status(500).send(err.message);
    }
});

// Function to calculate age from DOB
function calculateAge(dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

//Login route -> /user/login -> so that render to login.ejs template
app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    console.log("Login Request:", req.body); // Log email and password

    try {
        const user = await User.findOne({ Email: email });
        if (!user) {
            return res.status(400).send("Invalid email or password");
        }

        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(400).send("Invalid email or password");
        }

        const token = jwt.sign({ id: user._id, email: user.Email }, 'yourSecretKey', { expiresIn: '1h' });

        res.json({ token, message: 'Login successful' });
    } catch (err) {
        console.log("Login Error:", err.message);
        res.status(500).send("Error during login");
    }
});

//Borrow route 
app.get("/borrow", (req, res) => {
    res.render("borrow.ejs");
});

// Borrow Money API
app.post("/borrow", async (req, res) => {
    const { email, amount, tenure } = req.body;

    try {
        const user = await User.findOne({ Email: email });
        if (!user) {
            return res.status(400).send("User not found");
        }

        // Calculate interest and monthly repayment
        const interestRate = 0.08;
        const totalRepayment = amount * Math.pow(1 + interestRate, tenure);
        const monthlyRepayment = totalRepayment / (tenure * 12);

        // Update the Purchase Power amount
        user.PurchasePower += amount;
        await user.save();

        res.json({
            PurchasePower: user.PurchasePower,
            MonthlyRepayment: monthlyRepayment.toFixed(2)
        });
    } catch (err) {
        console.log("Borrow Money Error:", err.message);
        res.status(500).send("Error during borrowing money");
    }
});
