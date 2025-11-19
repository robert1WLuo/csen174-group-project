This project is to develop a web-based application that allows users to set up user-edited plant profile and routine to keep track of necessary plumbing, watering, etc.
The main contributors of this project are Wenguang Luo, Jixian Deng, Valerie Prompa(quit). 
The work is divided as follows: Wenguang Luo is responsible for ui design, front end interface, adding and editing plant profile, backend database for plant
Jixian Deng is responsible for backend database for user, login with credentials, reminder email feature
 
How to Run
1. configure environment variables in the terminal

export SMTP_USER="plantdiaryCSEN174@gmail.com"
export SMTP_PASS="vuyfuzctuxzybzkt"
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_SECURE="tls"
export FROM_EMAIL="plantdiaryCSEN174@gmail.com"
export FROM_NAME="Plant Diary"

2. Start PHP Backend in terminal
php -S 127.0.0.1:8000 api.php

3. Access Application
Open in browser: http://127.0.0.1:8000/login.html
4. Test Flow
==========================

ALL FEATURES:
Register a new account
Login with credentials
View your profile  
Edit plant profile(add description, upload plant image, etc)
Set routine reminders(deadline for watering, plumbing, etc)
send reminding emails to users when reminding deadline is close
Chat with other users(currently saved in local computer cache only)
Logout when done
