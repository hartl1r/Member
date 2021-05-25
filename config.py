# config.py #

import os
import pyodbc
import urllib
from flask import Flask
from dotenv import load_dotenv
from flask_mail import Mail,Message
app = Flask(__name__)

# LOAD dotenv IN THE BASE DIRECTORY
basedir = os.path.abspath(os.path.dirname(__file__))
dotenv_path = os.path.join(basedir, '.env')
load_dotenv(dotenv_path)

params = urllib.parse.quote_plus('DRIVER=' +  os.getenv('Driver') + ';'
                                    'SERVER=' + os.getenv('Server') + ';'
                                    'DATABASE=' + os.getenv('Database') + ';'
                                    'UID=' + os.getenv('Username') + ';'
                                    'PWD=' + os.getenv('Password') + ';'
)
conn_str = 'mssql+pyodbc:///?odbc_connect={}'.format(params)

class Config(object):
    SQLALCHEMY_DATABASE_URI = conn_str 
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TEMPLATES_AUTO_RELOAD=True 
    SECRET_KEY = os.environ.get('Secret_key')
    MAIL_SERVER = os.environ.get('Mail_server')
    MAIL_PORT = os.environ.get('Mail_port')
    MAIL_USERNAME = os.environ.get('Mail_username')
    MAIL_PASSWORD = os.environ.get('Mail_password')
    MAIL_USE_TLS = os.environ.get('Mail_use_tls')
