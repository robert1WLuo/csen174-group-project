//Account.cpp: Creates accounts, allows signing in, allows changing of passwords
//pseudo:
//--create account--
//enter email, keep track of email in dynamic 2D array (double in size each time size limit is reached)
//top array contains emails, bottom array contains passwords
//insert
//--sign in--
//enter email, use email to search array (basic search, skip over empty spaces, threads?)
//change data (change password), send email to change password
//--delete account--
//while not necessarily in the sign in/create account webpages, worth doing now while I'm here
//should not delete space, only clear data
//while deletions would be uncommon, might be better to not shift but instead flag when space is available
//for future insertions

#include <iostream>
#include <cstring>
#include <vector>
using namespace std;

char** emails = new char*[2] {};
char** passwords = new char*[2] {};
int array_count = 0;
int array_max = 50;
char email[50];
char password[50];
//This vector is important for deletions. Keeps list of spaces made by deletions
//Don't make it ordered. It's for an array
vector<int> available_spaces(10,-1);

void increase_array(){
    int new_size = array_max * 2;
    char** Extended_Emails = new char*[new_size] {};
    char** Extended_Passwords = new char*[new_size] {};
    copy(emails, emails + 50, Extended_Emails);
    copy(passwords, passwords + 50, Extended_Passwords);
    delete[] emails;
    delete[] passwords;
    emails = Extended_Emails;
    passwords = Extended_Passwords;
    array_max = new_size;
    return;
}

void create(){
    cout << "Enter Email" << endl;
    cin >> email;
    cout << "Enter Password" << endl;
    cin >> password;
    if (available_spaces[0] != -1){
        int index = available_spaces[0];
        emails[index] = email;
        passwords[index] = password;
    }
    else{
        if (array_count == array_max){
            increase_array();
        }
        emails[array_count] = email;
        passwords[array_count] = password;
        array_count++;
    }
    return;
}

void sign_in(){
    cout << "Enter Email" << endl;
    cin >> email;
    cout << "Enter Password" << endl;
    cin >> password;
    for (int i = 0; i < array_count; i++){
        if (strcmp(email, emails[i]) == 0){
            if (strcmp(password, passwords[i]) == 0){
                cout << "Sign In Successful" << endl;
                return;
            }
            else {
                cout << "Incorrect Password" << endl;
                return;
            }
        }
    }
    cout << "Account Not Found" << endl;
    return;
}

void delete_account(){
    for (int i = 0; i < array_count; i++){
        if (strcmp(email, emails[i]) == 0){
            if (strcmp(password, passwords[i]) == 0){
                emails[i] = nullptr;
                passwords[i] = nullptr;
                array_count--;
                available_spaces.insert(available_spaces.begin(), i);
                return;
            }
        }
    }
    cout << "Error - Account Does Not Appear To Exist" << endl;
    return;
}

int main(){
    /* Since this code will be connected to the website (which I don't have and don't know how to do yet)
       I'm gonna have to make do with this*/
    for (int i = 0; i < 50; i++){
        emails[i] = new char[50];
        passwords[i] = new char[50];
    }
    char option[20];
    char option1[20] = {"Create"};
    char option2[20] = {"Sign In"};
    char option3[20] = {"Exit"};
    int flag = 0;
    cout << "Type in Option: Create, Sign In, or Exit" << endl;
    cin.getline(option, 20);
    while(flag == 0){
        if (strcmp(option, option1) == 0){
            cout << "create selected" << endl;
            create();
        }
        else if (strcmp(option, option2) == 0){
            cout << "sign in selected" << endl;
            sign_in();
            char option_2[20];
            cout << "Would you like to delete? Yes or No" << endl;
            cin >> option_2;
            if (strcmp(option_2, "Yes") == 0){
                cout << "Deleting account..." << endl;
                delete_account();
            }
            else if (strcmp(option_2, "No") == 0){
                continue;
            }
            else {
                cout << "Invalid Input" << endl;
                continue;
            }
        }
        else if (strcmp(option, option3) == 0){
            return 0;
        }
        else{
            cout << "Incorrect Input, Try Again" << endl;
        }
        option[0] = '\0';
        cout << "Type in Option: Create, Sign In, Delete Account, or Exit" << endl;
        cin.getline(option, 20);
    }
    return 0;
}