#ifndef ACCOUNT_HPP
#define ACCOUNT_HPP

#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>
#include <cctype>
#include <algorithm>
#include <sstream>
#include <vector>

#include "PlatformCompat.h"
using namespace std;

class Account {
private:
    string username;
    string password;
    string name;
    string email;
    string contactNumber;

    static vector<string> splitCSV(const string& line) {
        vector<string> parts;
        string token;
        stringstream ss(line);
        while (getline(ss, token, ',')) {
            parts.push_back(token);
        }
        return parts;
    }

    static string joinCSV(const vector<string>& parts) {
        string out;
        for (size_t i = 0; i < parts.size(); i++) {
            if (i) out += ",";
            out += parts[i];
        }
        return out;
    }

    string encryptPassword(const string& password) {
        string encryptedPassword = password;
        // Perform a simple hash by reversing the password
        reverse(encryptedPassword.begin(), encryptedPassword.end());
        return encryptedPassword;
    }

    bool isUserExists(const string& username) {
        ifstream file("credentials");
        string line;
        while (getline(file, line)) {
            if (line.substr(0, line.find(',')) == username) {
                return true;
            }
        }
        return false;
    }

    bool isLoginValid(const string& username, const string& password) {
        ifstream file("credentials");
        string line;
        while (getline(file, line)) {
            size_t commaPos = line.find(',');
            string storedUsername = line.substr(0, commaPos);
            string storedPassword = line.substr(commaPos + 1, line.find(',', commaPos + 1) - commaPos - 1);

            if (storedUsername == username && storedPassword == encryptPassword(password)) {
                return true;
            }
        }
        return false;
    }

    void createUser(const string& username, const string& password) {
        ofstream file("credentials", ios_base::app);
        file << username << "," << encryptPassword(password) << "," << name << "," << email << "," << contactNumber << endl;
        cout << "User created successfully." << endl;
    }

public:
    bool isValidEmail(const string& email) {
        // Check for the presence of '@' symbol
        size_t atPos = email.find('@');
        if (atPos == string::npos)
            return false;
        // Check for the presence of '.' after the '@' symbol
        size_t dotPos = email.find('.', atPos);
        if (dotPos == string::npos)
            return false;
        // Check if there are at least two characters after the last dot
        if (dotPos >= email.length() - 2)
            return false;
    
        return true;
    }

    void registerUser() {
        hrs_pause();
        hrs_clear_screen();
        cout << "=== Register ===" << endl;
        cout << "Enter name: ";
        cin.ignore();
        getline(cin, name);

        bool validEmail = false;

        while (!validEmail) {
            cout << "Enter email: ";
            cin >> email;
        
            if (!isValidEmail(email)) {
                cout << "Invalid email format. Please enter a valid email." << endl;
            } else {
                validEmail = true;
            }
        }


        bool validContactNumber = false;
        while (!validContactNumber) {
            cout << "Enter contact number (11 digits): ";
            cin >> contactNumber;
            if (contactNumber.length() == 11) {
                bool allDigits = true;
                for (char c : contactNumber) {
                    if (!isdigit(c)) {
                        allDigits = false;
                        break;
                    }
                }
                if (allDigits) {
                    validContactNumber = true;
                }
            }
            if (!validContactNumber) {
                cout << "Invalid contact number. Please enter a valid 11-digit number." << endl;
            }
        }

        bool usernameExists = false;
        
        while (!usernameExists) {
            cout << "Enter username: ";
            cin >> username;
        
            if (isUserExists(username)) {
                cout << "Username already exists. Please try again." << endl;
            } else if (username == "admin") {
                cout << "'admin' is restricted as a username. Please try again." << endl;
            } else {
                cout << "Enter password: ";
                cin >> password;
                createUser(username, password);
                usernameExists = true;
            }
        }

    }

    string getMaskedInput() {
        const char maskChar = '*';
        string input;
        char ch;
            
        while (true) {
            ch = static_cast<char>(hrs_getch());
            if (ch == '\r' || ch == '\n') break;
            if (ch == '\b' || ch == 127) {
                if (!input.empty()) {
                    input.pop_back();
                    cout << "\b \b";
                }
            } else {
                input.push_back(ch);
                cout << maskChar;
            }
        }
        cout << endl;
        return input;
    }

    string loginUser() {
        hrs_clear_screen();
        cout << "=== Log In ===" << endl;
        cout << "Enter username: ";
        cin >> username;
        if (username == "admin") {
            cout << "Enter password: ";
            string password = getMaskedInput();
            if (password == "hrsadmin") {
                return "admin";
            } else {
                cout << "Invalid password." << endl;
                return "";
            }
        }
        if (!isUserExists(username)) {
            cout << "User does not exist." << endl;
            return "";
        } else {
            cout << "Enter password: ";
            string password = getMaskedInput();
            if (isLoginValid(username, password)) {
                return username;
            } else {
                cout << "Invalid username or password." << endl;
                return "";
            }
        }
    }

    bool isCurrentPasswordValid(const string& username, const string& currentPassword) {
        ifstream file("credentials");
        string line;
        while (getline(file, line)) {
            size_t commaPos = line.find(',');
            string storedUsername = line.substr(0, commaPos);
            string storedPassword = line.substr(commaPos + 1, line.find(',', commaPos + 1) - commaPos - 1);

            if (storedUsername == username && storedPassword == encryptPassword(currentPassword)) {
                return true;
            }
        }
        return false;
    }

    void changePassword(const string& username, const string& currentPassword, const string& newPassword) {
        if (!isCurrentPasswordValid(username, currentPassword)) {
            cout << "Incorrect current password." << endl;
            return;
        }

        // Read the credentials file
        ifstream file("credentials");
        string line;
        stringstream newFileContents;

        // Process each line in the file
        while (getline(file, line)) {
            vector<string> parts = splitCSV(line);
            if (parts.size() < 5) {
                newFileContents << line << endl;
                continue;
            }

            if (parts[0] == username && parts[1] == encryptPassword(currentPassword)) {
                parts[1] = encryptPassword(newPassword);
                newFileContents << joinCSV(parts) << endl;
                cout << "Password changed successfully." << endl;
            } else {
                newFileContents << line << endl;
            }
        }

        // Write the updated contents back to the file
        ofstream outFile("credentials");
        outFile << newFileContents.str();
    }

    void updateEmail(const string& username, const string& currentPassword, const string& newEmail) {
        if (!isValidEmail(newEmail)) {
            cout << "Invalid email format." << endl;
            return;
        }
        if (!isCurrentPasswordValid(username, currentPassword)) {
            cout << "Incorrect current password." << endl;
            return;
        }

        // Read the credentials file
        ifstream file("credentials");
        string line;
        stringstream newFileContents;

        // Process each line in the file
        while (getline(file, line)) {
            vector<string> parts = splitCSV(line);
            if (parts.size() < 5) {
                newFileContents << line << endl;
                continue;
            }

            if (parts[0] == username && parts[1] == encryptPassword(currentPassword)) {
                parts[3] = newEmail;
                newFileContents << joinCSV(parts) << endl;
                cout << "Email updated successfully." << endl;
            } else {
                newFileContents << line << endl;
            }
        }

        // Write the updated contents back to the file
        ofstream outFile("credentials");
        outFile << newFileContents.str();
    }

    void updateContactNumber(const string& username, const string& currentPassword, const string& newContactNumber) {
        if (newContactNumber.length() != 11) {
            cout << "Invalid contact number. Please enter an 11-digit number." << endl;
            return;
        }
        for (char c : newContactNumber) {
            if (!isdigit(static_cast<unsigned char>(c))) {
                cout << "Invalid contact number. Please enter an 11-digit number." << endl;
                return;
            }
        }
        if (!isCurrentPasswordValid(username, currentPassword)) {
            cout << "Incorrect current password." << endl;
            return;
        }

        // Read the credentials file
        ifstream file("credentials");
        string line;
        stringstream newFileContents;

        // Process each line in the file
        while (getline(file, line)) {
            vector<string> parts = splitCSV(line);
            if (parts.size() < 5) {
                newFileContents << line << endl;
                continue;
            }

            if (parts[0] == username && parts[1] == encryptPassword(currentPassword)) {
                parts[4] = newContactNumber;
                newFileContents << joinCSV(parts) << endl;
                cout << "Contact number updated successfully." << endl;
            } else {
                newFileContents << line << endl;
            }
        }

        // Write the updated contents back to the file
        ofstream outFile("credentials");
        outFile << newFileContents.str();
    }
    void printUserInfo(const string& username) {
        ifstream file("credentials");
        string line;
        while (getline(file, line)) {
            vector<string> parts = splitCSV(line);
            if (parts.size() < 5) continue;
            if (parts[0] == username) {
                const string& storedName = parts[2];
                const string& storedEmail = parts[3];
                const string& storedContactNumber = parts[4];
                cout << "=== User Info ===" << endl << endl;
                cout << "Username: " << username << endl;
                cout << "Name: " << storedName << endl;
                cout << "Email: " << storedEmail << endl;
                cout << "Contact Number: " << storedContactNumber << endl;
    
                return;
            }
        }
    
        cout << "User information not found." << endl;
    }

    

};

#endif

