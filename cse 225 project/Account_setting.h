#ifndef ACCOUNT_SETTING_H
#define ACCOUNT_SETTING_H

#include <iostream>
#include <string>

#include "Account.h"
#include "HRS.h"
#include "PlatformCompat.h"

inline void Account_setting(HotelReservationSystem& /*sys*/, const std::string& loggedInUsername) {
  Account account;

  while (true) {
    hrs_clear_screen();
    std::cout << "=== Account Settings ===\n";
    std::cout << "Logged in as: " << loggedInUsername << "\n\n";
    std::cout << "[a] View my info\n";
    std::cout << "[b] Change password\n";
    std::cout << "[c] Update email\n";
    std::cout << "[d] Update contact number\n";
    std::cout << "[e] Back\n";
    std::cout << "Enter your choice: ";

    char choice = 0;
    std::cin >> choice;

    switch (choice) {
      case 'a':
      case 'A':
        hrs_clear_screen();
        account.printUserInfo(loggedInUsername);
        hrs_pause();
        break;

      case 'b':
      case 'B': {
        hrs_clear_screen();
        std::cout << "=== Change Password ===\n";
        std::cout << "Enter current password: ";
        const std::string currentPassword = account.getMaskedInput();
        std::cout << "Enter new password: ";
        const std::string newPassword = account.getMaskedInput();
        std::cout << "Confirm new password: ";
        const std::string confirmPassword = account.getMaskedInput();

        if (newPassword != confirmPassword) {
          std::cout << "Passwords do not match.\n";
          hrs_pause();
          break;
        }

        account.changePassword(loggedInUsername, currentPassword, newPassword);
        hrs_pause();
        break;
      }

      case 'c':
      case 'C': {
        hrs_clear_screen();
        std::cout << "=== Update Email ===\n";
        std::cout << "Enter current password: ";
        const std::string currentPassword = account.getMaskedInput();
        std::cout << "Enter new email: ";
        std::string newEmail;
        std::cin >> newEmail;
        account.updateEmail(loggedInUsername, currentPassword, newEmail);
        hrs_pause();
        break;
      }

      case 'd':
      case 'D': {
        hrs_clear_screen();
        std::cout << "=== Update Contact Number ===\n";
        std::cout << "Enter current password: ";
        const std::string currentPassword = account.getMaskedInput();
        std::cout << "Enter new contact number: ";
        std::string newContact;
        std::cin >> newContact;
        account.updateContactNumber(loggedInUsername, currentPassword, newContact);
        hrs_pause();
        break;
      }

      case 'e':
      case 'E':
        return;

      default:
        std::cout << "Invalid choice.\n";
        hrs_pause();
        break;
    }
  }
}

#endif
