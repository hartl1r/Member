# __init__.py

from flask import Flask, session
from flask_sqlalchemy import SQLAlchemy
from flask_bootstrap import Bootstrap
from config import Config

import os

app = Flask(__name__)
app.config.from_object(Config)
app.config["TEMPLATES_AUTO_RELOAD"] = True
db = SQLAlchemy(app)
bootstrap = Bootstrap(app)

from app import routes, models, errors
