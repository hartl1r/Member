import logging
from logging.handlers import SMTPHandler
from logging.handlers import RotatingFileHandler 
import app

if not app.debug:
    # if 'shopID' in session:
    #     shopID = session['shop_ID']
    # else:
    #     shopID = 'RA'
    shopID = 'RA'
    if app.config['MAIL_SERVER']:
        print('setting up mail ...')
        # set up email
        auth = None
        if app.config['MAIL_USERNAME'] or app.config['MAIL_PASSWORD']:
            auth = (app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
        secure = None
        if app.config['MAIL_USE_TLS']:
            secure = ()
        mail_handler = SMTPHandler(
            mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
            fromaddr='no-reply@' + app.config['MAIL_SERVER'],
            toaddrs=app.config['ADMINS'], subject='VWC Front desk - '+ shopID,
            credentials=auth, secure=secure)
        #mail_handler.setLevel(logging.ERROR)
        mail_handler.setLevel(logging.INFO)
        print('addHandler ...')
        app.logger.addHandler(mail_handler)

        # logger
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/VWC.log', maxBytes=10240,
                                        backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        print('before setLevel info')
        app.logger.setLevel(logging.INFO)
        
        app.logger.info('VWC Front Desk - ' + shopID)
