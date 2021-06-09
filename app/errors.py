# errors.py

from flask import render_template
#from merry import Merry
from app import app, db

#merry = Merry()

@app.errorhandler(404)
def not_found_error(error):
    print('error:',error)
    return render_template('404.html',errorMsg=error), 404

@app.errorhandler(500)
def internal_error(error):
    print('error:',error)
    db.session.rollback()
    return render_template('500.html',errorMsg=error), 500

@app.errorhandler(Exception)
def handle_exception(e):
    return render_template('500.html',errorMsg = e),500
    