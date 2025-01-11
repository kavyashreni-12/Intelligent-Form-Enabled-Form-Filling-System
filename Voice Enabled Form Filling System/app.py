from flask import Flask, render_template, request, jsonify, send_file
import mysql.connector
import os

app = Flask(__name__)

# MySQL database configuration
db = mysql.connector.connect(
    host="localhost",
    user="root",  # Replace with your MySQL username
    password="Iamvaishu@12#",  # Replace with your MySQL password
    database="voiceform"  # Replace with your database name
)

cursor = db.cursor()

# Create table if it doesn't exist
cursor.execute("""
CREATE TABLE IF NOT EXISTS form_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    country_code VARCHAR(10),
    phone VARCHAR(20)
)
""")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/submit", methods=["POST"])
def submit_form():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    country_code = data.get("countryCode")
    phone = data.get("phone")

    query = "INSERT INTO form_data (name, email, country_code, phone) VALUES (%s, %s, %s, %s)"
    cursor.execute(query, (name, email, country_code, phone))
    db.commit()

    return jsonify({"message": "Form submitted successfully!"})

@app.route("/download", methods=["POST"])
def download_form():
    data = request.json
    file_path = "form_data.txt"

    with open(file_path, "w") as file:
        file.write(f"Name: {data['name']}\n")
        file.write(f"Email: {data['email']}\n")
        file.write(f"Country Code: {data['countryCode']}\n")
        file.write(f"Phone: {data['phone']}\n")

    return send_file(file_path, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
