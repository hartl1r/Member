# routes.py
from flask import session, render_template, flash, redirect, url_for, request, jsonify, json, make_response, after_this_request
from sqlalchemy.sql.expression import false, true
from flask_wtf import FlaskForm

from app.forms import LocalAddressPhone, NewMember
from flask_bootstrap import Bootstrap

from werkzeug.urls import url_parse
from app.models import ShopName, Member, MemberActivity, MonitorSchedule, MonitorScheduleTransaction,\
MonitorWeekNote, CoordinatorsSchedule, ControlVariables, NotesToMembers, MemberTransactions,\
DuesPaidYears, WaitList, KeysTable, Village, ZipCode, MemberPhotos
from app import app
from app import db
from sqlalchemy import func, case, desc, extract, select, update, text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DBAPIError

import datetime as dt
from datetime import date, datetime, timedelta
from pytz import timezone

# from flask_mail import Mail, Message
# mail=Mail(app)
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import pyodbc
import base64
import os, fnmatch

from base64 import b64decode
from io import BytesIO
from PIL import Image

import logging

logging.basicConfig(filename='record.log', level=logging.DEBUG, format=f'%(asctime)s %(levelname)s %(name)s %(threadName)s : %(message)s')

@app.route('/')
@app.route('/index/')
def index():
    app.logger.info('Info level log')
    app.logger.warning('Warning level log')
    currentURL = app.config['CURRENT_URL']

    # GET CURRENT SCHEDULE YEAR
    currentScheduleYear = db.session.query(ControlVariables.monitorYear).filter(ControlVariables.Shop_Number==1).scalar()
    lastYear = str(int(currentScheduleYear)-1)
   
    # GET VILLAGE ID FROM QUERY STRING IN URL, ?villageID=123456
    villageID = request.args.get('villageID')
    scheduleYear = request.args.get('scheduleYear')
    if scheduleYear == None:
         scheduleYear = currentScheduleYear
   
    # GET SESSION VARIABLES THAT WERE SET AT LOGIN
    staffID = getStaffID()
    shopID = getShopID()
    staffName = getStaffName()
    
    # GET STAFF PRIVILEDGES (staffName is available as session variable from login.)
    staffMember = db.session.query(Member).filter(Member.Member_ID == staffID).first()
    if staffMember == None:
        if villageID != None:
            msg = "No match for staffID " + villageID + "; cannot continue."
        else:
            msg = "Missing village ID for staff member; cannot continue."
        flash(msg,"danger")
        return msg

    # GET POSITION OF USER - Staff, DBA, Manager
    # isDBA, isManager, isStaff are not boolean because we cannot pass boolean values to client???
    if (staffMember.DBA):
        isDBA = 'True'
    else:
        isDBA = 'False'

    if (staffMember.Manager):
        isManager = 'True'
    else:
        isManager = 'False'

    if (staffMember.Office_Staff):
        isStaff = 'True'
    else:
        isStaff = 'False'
    
    if (staffMember.Monitor_Coordinator):
        isCoordinator = 'True'
    else:
        isCoordinator = 'False'

    #print(isDBA,isManager,isStaff)
    
    if (isDBA == 'False' and isManager == 'False' and isStaff == 'False') :          
        return render_template('notAuthorized.html',staffName=staffName)
        
    # BUILD ARRAY OF NAMES & ID's FOR DROPDOWN LIST OF MEMBERS
    nameArray=[]
    sqlSelect = "SELECT Last_Name, First_Name, Member_ID FROM tblMember_Data "
    sqlSelect += "ORDER BY Last_Name, First_Name "
    try:
        nameList = db.engine.execute(sqlSelect)
    except Exception as e:
        flash("Could not retrieve member list.","danger")
        return 'ERROR in index function.'
    position = 0
    if nameList == None:
        flash('No names to list.','danger')

    # NEED TO PLACE NAME IN AN ARRAY BECAUSE OF NEED TO CONCATENATE 
    for n in nameList:
        position += 1
        if n.First_Name == None:
            lastFirst = n.Last_Name
        else:
            lastFirst = n.Last_Name + ', ' + n.First_Name + ' (' + n.Member_ID + ')'
        nameArray.append(lastFirst)


    # PREPARE LIST OF VILLAGES
    sqlSelect = "SELECT Village_Name FROM tblValid_Village_Names "
    sqlSelect += "ORDER BY Village_Name"
    try:
        villages = db.engine.execute(sqlSelect)
    except Exception as e:
        flash("Could not retrieve village name list.","danger")
        return 'ERROR in index village function.'
    
    if villages == None:
        flash('No villages to list.','info')
    

    # GET ZIPCODES
    zipCodes = db.session.query(ZipCode).order_by(ZipCode.Zipcode).all()
   

    # COMPUTE NUMBER ON WAIT LIST
    waitListCnt = db.session.query(func.count(WaitList.MemberID))\
    .filter(WaitList.NoLongerInterested == None)\
    .filter(WaitList.ApplicantDeclines == None).scalar()
    #     WaitList.Notified != None,
    #     WaitList.ApplicantAccepts != None,
    #     WaitList.ApprovedToJoin != None,
    #     WaitList.ApplicantAccepts != None,
    #     WaitList.ApplicantDeclines != None,
    #     WaitList.NoLongerInterested != None).scalar()
    
    # GET CURRENT DUES YEAR
    currentDuesYear = db.session.query(ControlVariables.Current_Dues_Year).filter(ControlVariables.Shop_Number == 1).scalar()
    
    # GET DATE TO ACCEPT DUES
    acceptDuesDate = db.session.query(ControlVariables.Date_To_Begin_New_Dues_Collection).filter(ControlVariables.Shop_Number == 1).scalar()
        
    # IF A VILLAGE ID WAS NOT PASSED IN, DISPLAY THE BLANK INDEX.HTML FORM AND HAVE USER SELECT A NAME OR ID
    if (villageID == None):
        return render_template("member.html",member="",nameArray=nameArray,waitListCnt=waitListCnt,
        currentDuesYear=currentDuesYear,acceptDuesDate=acceptDuesDate,staffName=staffName,staffID=staffID,
        isManager=isManager,isDBA=isDBA,isCoordinator=isCoordinator,villages=villages,zipCodes=zipCodes,
        currentURL=currentURL)


    # IF A VILLAGE ID WAS PASSED IN ...

    # RUN QUERY TO POPULATE LOCAL ADDRESS PHONE EMAIL
    member = db.session.query(Member).filter(Member.Member_ID == villageID).first()
    if (member == None):
        return render_template("member.html",member='',nameArray=nameArray,staffName=staffName,staffID=staffID)

    hdgName = member.First_Name
    if member.Middle_Name is not None:
        if len(member.Middle_Name) > 0 :
            hdgName += ' ' + member.Middle_Name
    hdgName += ' ' + member.Last_Name
    if member.Nickname is not None:
        if len(member.Nickname) > 0 :
            hdgName += ' (' + member.Nickname + ')'

    # TEST FOR TEMPORARY VILLAGE ID EXPIRATION DATE
    expireMsg = ''
    todays_date = date.today()
    todaySTR = todays_date.strftime('%m-%d-%Y')
     
    if (member.Temporary_Village_ID == True):
        if member.Temporary_ID_Expiration_Date != None:
            minus30 = member.Temporary_ID_Expiration_Date - timedelta(days=30)
            if minus30 < todays_date:
                expireMsg = '< 30 days'
            if member.Temporary_ID_Expiration_Date < todays_date:
                expireMsg = 'ID EXPIRED!'
    else:
        expireMsg = ''

    # GET MEMBERS MONITOR SCHEDULE FOR SPECIFIED YEAR
    sqlMemberSchedule = "SELECT format(Date_Scheduled,'ddd M/d/y') as DateScheduled, AM_PM, Duty, No_Show, Shop_Abbr, Shop_Name FROM tblMonitor_Schedule "
    sqlMemberSchedule += "LEFT JOIN tblShop_Names ON tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number "
    sqlMemberSchedule += "WHERE Member_ID = '" + villageID + "' and DatePart(year,[Date_Scheduled])='" + scheduleYear + "' "
    sqlMemberSchedule += "ORDER BY Date_Scheduled"
    memberSchedule = db.engine.execute(sqlMemberSchedule)
    
    # SET BEGIN DATE TO 12 MONTHS PRIOR TO CURRENT DATE
    # beginDateDAT = todays_date - timedelta(days=365)
    # beginDateSTR = beginDateDAT.strftime('%m-%d-%Y')

    # FUTURE MONITOR DUTY
    # sqlFutureDuty = "SELECT format(Date_Scheduled,'ddd M/d/y') as DateScheduled, AM_PM, Duty, Shop_Abbr, Shop_Name FROM tblMonitor_Schedule "
    # sqlFutureDuty += "LEFT JOIN tblShop_Names ON tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number "
    # sqlFutureDuty += "WHERE Member_ID = '" + villageID + "' and Date_Scheduled >='" + todaySTR + "' "
    # sqlFutureDuty += "ORDER BY Date_Scheduled"
    # futureDuty = db.engine.execute(sqlFutureDuty)
    
    # PAST MONITOR DUTY
    # sqlPastDuty = "SELECT format(Date_Scheduled,'ddd M/d/y') as DateScheduled, AM_PM, Duty, Shop_Abbr, Shop_Name, iif(No_Show = 1,'NS','') as NoShow "
    # sqlPastDuty += " FROM tblMonitor_Schedule "
    # sqlPastDuty += "LEFT JOIN tblShop_Names ON tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number "
    # sqlPastDuty += "WHERE Member_ID = '" + villageID + "' and Date_Scheduled BETWEEN '" + beginDateSTR + "' and '" + todaySTR + "' "
    # sqlPastDuty += "ORDER BY Date_Scheduled"
    # pastDuty = db.engine.execute(sqlPastDuty)
   
    
    # DOES THE MEMBER HAVE AN UNEXPIRED MONITOR WAIVER?
    hasWaiver = False
    todaysDate = date.today() 
    
    if member.Monitor_Duty_Waiver_Expiration_Date == None:
        hasWaiver = False
    else:
        if member.Monitor_Duty_Waiver_Expiration_Date > todaysDate:
            hasWaiver = True
        else:
            hasWaiver = False

       
    # DOES THE MEMBER NEED TRAINING FOR EITHER LOCATION?
    RAtrainingNeeded = ''
    BWtrainingNeeded = ''
    if hasWaiver == False:
        # DOES MEMBER NEED TRAINING FOR ROLLING ACRES?
        if member.Last_Monitor_Training == None:
            RAtrainingNeeded = 'Training Needed'
        else:
            RAlastAcceptableTrainingDate = db.session.query(ControlVariables.Last_Acceptable_Monitor_Training_Date).filter(ControlVariables.Shop_Number == 1).scalar()
            if member.Last_Monitor_Training < RAlastAcceptableTrainingDate:
                RAtrainingNeeded = 'Training Needed'
        
        # DOES MEMBER NEED TRAINING FOR BROWNWOOD
        if member.Last_Monitor_Training_Shop_2 == None:
            BWtrainingNeeded = 'Training Needed'
        else:
            BWlastAcceptableTrainingDate = db.session.query(ControlVariables.Last_Acceptable_Monitor_Training_Date).filter(ControlVariables.Shop_Number == 2).scalar()
            if member.Last_Monitor_Training_Shop_2 < BWlastAcceptableTrainingDate:
                BWtrainingNeeded = 'Training Needed'
    
    if member.NonMember_Volunteer == True:
        RAtrainingNeeded = ''
        BWtrainingNeeded = ''

    # GET LAST PAID YEAR
    lastYearPaid = db.session.query(func.max(DuesPaidYears.Dues_Year_Paid)).filter(DuesPaidYears.Member_ID == villageID).scalar()
    
    # DOES MEMBER HAVE KEYS?
    numberOfKeys = db.session.query(func.count(KeysTable.MemberID)).filter(KeysTable.MemberID == villageID).scalar()
    if numberOfKeys == 0:
        hasKeys = ''
    else:
        hasKeys = "Member has " + str(numberOfKeys) + " key(s)"

    return render_template("member.html",member=member,hdgName=hdgName,nameArray=nameArray,expireMsg=expireMsg,
    memberSchedule=memberSchedule,RAtrainingNeeded=RAtrainingNeeded,BWtrainingNeeded=BWtrainingNeeded,
    lastYearPaid=lastYearPaid,currentDuesYear=currentDuesYear,acceptDuesDate=acceptDuesDate,
    waitListCnt=waitListCnt,hasKeys=hasKeys,villages=villages,staffName=staffName,isStaff=isStaff,
    isManager=isManager,isDBA=isDBA,zipCodes=zipCodes,thisYear=currentScheduleYear,lastYear=lastYear,
    staffID=staffID,currentURL=currentURL)
    
@app.route('/saveAddress', methods=['POST'])
def saveAddress():
    
    # GET DATA FROM FORM
    memberID = request.form['memberID']

    if request.form.get('hasTemporaryVillageID') == 'True':
        hasTemporaryVillageID = True
    else:
        hasTemporaryVillageID = False

    lightspeedID = request.form.get('lightspeedID')

    tempIDexpirationDate = request.form.get('expireDt')
    staffID = request.form['staffID']
    
    street = request.form['street']
    city = request.form['city']
    state = request.form['state']
    zipcode = request.form['zip']
    village = request.form.get('village')
    homePhone = request.form['homePhone']
    cellPhone = request.form['cellPhone']
    eMail = request.form['eMail']

    # WAS ACTION CANCELLED?
    if request.form['localAction'] == 'CANCEL':
        return redirect(url_for('index',villageID=memberID))

    # GET MEMBER RECORD 
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    fieldsChanged = 0

    if member.Address != street :
        logChange('Street',memberID,street,member.Address)
        member.Address = street
        fieldsChanged += 1

    if member.City != city :
        logChange('City',memberID,city,member.City)
        member.City = city
        fieldsChanged += 1

    if member.Zip != zipcode:
        logChange('Zipcode',memberID,zipcode,member.Zip)
        member.Zip = zipcode
        fieldsChanged += 1

    if member.Village != village:
        logChange('Village',memberID,village,member.Village)
        member.Village = village
        fieldsChanged += 1
        
    if member.Home_Phone != homePhone :
        logChange('Home Phone',memberID,homePhone,member.Home_Phone)
        member.Home_Phone = homePhone
        fieldsChanged += 1


    if member.Cell_Phone != cellPhone :
        logChange('Cell Phone',memberID,cellPhone,member.Cell_Phone)
        member.Cell_Phone = cellPhone
        fieldsChanged += 1

    if member.eMail != eMail :
        logChange('Email',memberID,eMail,member.eMail)
        member.eMail = eMail
        fieldsChanged += 1

    if tempIDexpirationDate != '':
        hasTemporaryVillageID == True

    if hasTemporaryVillageID != member.Temporary_Village_ID:
        logChange('Temp ID',memberID,hasTemporaryVillageID,member.Temporary_Village_ID)
        member.Temporary_Village_ID = hasTemporaryVillageID
        fieldsChanged += 1

    if tempIDexpirationDate != member.Temporary_ID_Expiration_Date:
        logChange('Temp Expire Dt',memberID,tempIDexpirationDate,member.Temporary_ID_Expiration_Date)
        member.Temporary_ID_Expiration_Date = tempIDexpirationDate
        fieldsChanged += 1
    else:
        if tempIDexpirationDate == '':
            logChange('Temp Expire Dt',memberID,'Null',member.Temporary_ID_Expiration_Date)
            member.Temporary_ID_Expiration_Date = None
            member.Temporary_Village_ID = False
            fieldsChanged += 1
     
    if member.LightspeedID != lightspeedID :
        logChange('LightspeedID',memberID,lightspeedID,member.LightspeedID)
        member.LightspeedID = lightspeedID
        fieldsChanged += 1

    if fieldsChanged > 0:
        try:
            db.session.commit()
            flash("Changes successful","success")
        except Exception as e:
            flash("Could not update local member data.","danger")
            db.session.rollback()

    return redirect(url_for('index',villageID=memberID))

@app.route('/saveAltAddress', methods=['POST'])
def saveAltAddress():
    # GET DATA FROM FORM
    memberID = request.form['memberID']
    staffID = request.form['staffID']
    street = request.form['altStreet']
    city = request.form['altCity']
    state = request.form['altState']
    country=request.form['altCountry']
    zipcode = request.form['altZip']
    phone = request.form['altPhone']
    
    if request.form['altAction'] == 'CANCEL':
        return redirect(url_for('index',villageID=memberID))

    # INITIALIZE COUNTER FOR NUMBER OF FIELDS CHANGED
    fieldsChanged = 0

    # GET MEMBER RECORD
    try: 
        member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    except Exception as e:
        errorMsg = 'ERROR - could not read record for member # ',memberID + '\n'+e
        flash(errorMsg,'danger')
    if member.Alt_Street != street :
        logChange('Alt Street',memberID,street,member.Alt_Street)
        member.Alt_Street = street
        fieldsChanged += 1

    if member.Alt_City != city :
        logChange('Alt City',memberID,city,member.Alt_City)
        member.Alt_City = city
        fieldsChanged += 1

    if member.Alt_State != state :
        logChange('Alt State',memberID,state,member.Alt_State)
        member.Alt_State = state
        fieldsChanged += 1

    if member.Alt_Country != country :
        logChange('Alt Country',memberID,country,member.Alt_Country)
        member.Alt_Country = country
        fieldsChanged += 1

    if member.Alt_Zip != zipcode:
        logChange('Alt Zipcode',memberID,zipcode,member.Alt_Zip)
        member.Alt_Zip = zipcode
        fieldsChanged += 1

    if member.Alt_Phone != phone :
        logChange('Alt Phone',memberID,phone,member.Alt_Phone)
        member.Alt_Phone = phone
        fieldsChanged += 1

    if fieldsChanged > 0:
        try:
            db.session.commit()
            flash("Changes successful","success")
        except Exception as e:
            flash("Could not update alt address data.","danger")
            db.session.rollback()

    return redirect(url_for('index',villageID=memberID))

@app.route('/saveEmergency', methods=['POST'])
def saveEmergency():
    #  DID USER CANCEL?
    memberID = request.form['memberID']
    if request.form['emergAction'] == 'CANCEL':
        return redirect(url_for('index',villageID=memberID))

    # GET DATA FROM FORM
    staffID = request.form['staffID']
    contact = request.form['emergContact']
    phone = request.form['emergPhone']
    if request.form.get('emergDefib') == 'True':
        defibrillatorStatus = True
    else:
        defibrillatorStatus = False

    if request.form.get('emergNoData') == 'True':
        noEmergData = True
    else:
        noEmergData = False

    if request.form.get('pacemaker') == 'True':
        pacemaker = True
    else:
        pacemaker = False
    
    if request.form.get('stent') == 'True':
        stent = True
    else:
        stent = False

    if request.form.get('CABG') == 'True':
        CABG = True
    else:
        CABG = False

    if request.form.get('MI') == 'True':
        MI = True
    else:
        MI = False
    
    if request.form.get('diabetes1') == 'True':
        diabetes1 = True
    else:
        diabetes1 = False
    
    if request.form.get('diabetes2') == 'True':
        diabetes2 = True
    else:
        diabetes2 = False

    otherDiagnosis = request.form['otherDiagnosis']
    diabetesOther = request.form['diabetesOther']
    allergies = request.form['allergies']

     # GET MEMBER RECORD 
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    
    fieldsChanged = 0
    if member.Emerg_Name != contact:
        member.Emerg_Name = contact
        fieldsChanged += 1 

    if member.Emerg_Phone != phone:
        member.Emerg_Phone = phone
        fieldsChanged += 1    

    if defibrillatorStatus != member.Defibrillator_Trained:
        logChange('Defibrillator Trained',memberID,defibrillatorStatus,member.Defibrillator_Trained)
        member.Defibrillator_Trained = defibrillatorStatus
        fieldsChanged += 1

    if noEmergData != member.Emerg_No_Data_Provided:
        logChange('No Data Provided',memberID,noEmergData,member.Emerg_No_Data_Provided)
        member.Emerg_No_Data_Provided = noEmergData
        fieldsChanged += 1
    
    if pacemaker != member.Emerg_Pacemaker: 
        logChange('Pacemaker',memberID,pacemaker,member.Emerg_Pacemaker)
        member.Emerg_Pacemaker = pacemaker
        fieldsChanged += 1

    if stent != member.Emerg_Stent: 
        logChange('Stent',memberID,stent,member.Emerg_Stent)
        member.Emerg_Stent = stent
        fieldsChanged += 1

    if CABG != member.Emerg_CABG: 
        logChange('CABG',memberID,CABG,member.Emerg_CABG)
        member.Emerg_CABG = CABG
        fieldsChanged += 1

    if MI != member.Emerg_MI: 
        logChange('MI',memberID,MI,member.Emerg_MI)
        member.Emerg_MI = MI
        fieldsChanged += 1

    if diabetes1 != member.Emerg_Diabetes_Type_1: 
        logChange('diabetes1',memberID,diabetes1,member.Emerg_Diabetes_Type_1)
        member.Emerg_Diabetes_Type_1 = diabetes1
        fieldsChanged += 1

    if diabetes2 != member.Emerg_Diabetes_Type_2: 
        logChange('diabetes2',memberID,diabetes2,member.Emerg_Diabetes_Type_2)
        member.Emerg_Diabetes_Type_2 = diabetes2
        fieldsChanged += 1

    if otherDiagnosis != member.Emerg_Other_Diagnosis:
        logChange('otherDiagnosis',memberID,otherDiagnosis,member.Emerg_Other_Diagnosis)
        member.Emerg_Other_Diagnosis = otherDiagnosis
        fieldsChanged += 1

    if diabetesOther != member.Emerg_Diabetes_Other:
        logChange('diabetesOther',memberID,diabetesOther,member.Emerg_Diabetes_Other)
        member.Emerg_Diabetes_Other = diabetesOther
        fieldsChanged += 1

    if allergies != member.Emerg_Medical_Alergies:
        logChange('allergies',memberID,allergies,member.Emerg_Medical_Alergies)
        member.Emerg_Medical_Alergies = allergies
        fieldsChanged += 1

    # IF ANY FIELDS CHANGED, SAVE CHANGES
    if fieldsChanged > 0:
        try:
            db.session.commit()
            flash("Changes successful","success")
        except Exception as e:
            flash("Could not update member emergency data.","danger")
            db.session.rollback()

    return redirect(url_for('index',villageID=memberID))

@app.route('/saveMemberStatus', methods=['POST'])
def saveMemberStatus():
    # GET DATA FROM FORM
    memberID = request.form['memberID']
    if request.form['memberAction'] == 'CANCEL':
        return redirect(url_for('index',villageID=memberID))
     
    staffID = request.form['staffID']
    

    if request.form.get('villagesWaiverSigned') == 'True':
        villagesWaiverSigned = True
    else:
        villagesWaiverSigned = False
    villagesWaiverDateSigned = request.form.get('villagesWaiverDateSigned')

    if request.form.get('duesPaid') == 'True':
        duesPaid = True
    else:
        duesPaid = False 

    dateJoined = request.form.get('dateJoined')

    if request.form.get('restricted') == 'True':
        restricted = True
    else:
        restricted = False
    
    if request.form.get('volunteer') == 'True':
        volunteer = True
    else:
        volunteer = False

    if request.form.get('inactive') == 'True':
        inactive = True
    else:
        inactive = False
    
    inactiveDate = request.form.get('inactiveDate')
    
    if request.form.get('deceased') == 'True':
        deceased = True
    else:
        deceased = False
    
    if request.form.get('restricted') == 'True':
        restricted = True
    else:
        restricted = False
    
    reasonRestricted = request.form.get('reasonRestricted')
    memberNotes = request.form.get('memberNotes')

     # GET MEMBER RECORD 
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if member == None:
        flash("ERROR - Member "+memberID+" not found; restricted reason.",'danger')
    fieldsChanged = 0
    

    if villagesWaiverSigned != None:
        if villagesWaiverSigned != member.Villages_Waiver_Signed:
            logChange('Waiver Signed',memberID,villagesWaiverSigned,member.Villages_Waiver_Signed)
            member.Villages_Waiver_Signed = villagesWaiverSigned
            fieldsChanged += 1

    if villagesWaiverDateSigned != member.Villages_Waiver_Date_Signed:
        logChange('Waiver - Date Signed',memberID,villagesWaiverDateSigned,member.Villages_Waiver_Date_Signed)
        if villagesWaiverDateSigned == '':
            member.Villages_Waiver_Date_Signed = None 
        else:
            member.Villages_Waiver_Date_Signed = villagesWaiverDateSigned
        fieldsChanged += 1

    if duesPaid != member.Dues_Paid:
        logChange('Dues Paid',memberID,duesPaid,member.Dues_Paid)
        member.Dues_Paid = duesPaid
        fieldsChanged += 1

    if dateJoined != member.Date_Joined:
        logChange('Date Joined',memberID,dateJoined,member.Date_Joined)
        member.Date_Joined = dateJoined
        fieldsChanged += 1

    if volunteer != None:
        if volunteer != member.NonMember_Volunteer:
            logChange('Volunteer',memberID,volunteer,member.NonMember_Volunteer)
            member.NonMember_Volunteer = volunteer
            fieldsChanged += 1
    
    if inactive != None:
        if inactive != member.Inactive:
            logChange('Inactive',memberID,inactive,member.Inactive)
            member.Inactive = inactive
            fieldsChanged += 1   

    
    if inactiveDate != None:
        if inactiveDate != member.Inactive_Date:
            logChange('Inactive Date',memberID,inactiveDate,member.Inactive_Date)
            member.Inactive_Date = inactiveDate
            fieldsChanged += 1 

    if deceased != None:
        if deceased != member.Deceased:
            logChange('Deceased',memberID,deceased,member.Deceased)
            member.Deceased = deceased
            fieldsChanged += 1

    if restricted != None:
        if restricted != member.Restricted_From_Shop:
            logChange('Restricted',memberID,restricted,member.Restricted_From_Shop)
            member.Restricted_From_Shop = restricted
            fieldsChanged += 1

    if reasonRestricted != None:
        if reasonRestricted != member.Reason_For_Restricted_From_Shop:
            logChange('Reason Restricted',memberID,reasonRestricted,member.Reason_For_Restricted_From_Shop)
            member.Reason_For_Restricted_From_Shop = reasonRestricted
            fieldsChanged += 1

    if memberNotes != None:
        if memberNotes != member.Member_Notes:
            logChange('Member note',memberID,memberNotes,member.Member_Notes)
            member.Member_Notes = memberNotes
            fieldsChanged += 1

    if fieldsChanged > 0:
        try:
            db.session.commit()
            flash("Changes successful","success")
        except Exception as e:
            flash("Could not update membership data.","danger")
            print('Error - ',e)
            db.session.rollback()

    return redirect(url_for('index',villageID=memberID))


@app.route('/saveCertification', methods=['POST'])
def saveCertification():
    # GET DATA FROM FORM
    memberID = request.form['memberID']
    staffID = request.form['staffID']
    
    if request.form['certificationAction'] == 'CANCEL':
        return redirect(url_for('index',villageID=memberID))

    certifiedRAdate = request.form.get('certifiedRAdate')
    certifiedBWdate = request.form.get('certifiedBWdate')
    
    if request.form.get('certifiedRA') == 'True':
        certifiedRA = True
    else:
        certifiedRA = False

    if request.form.get('certifiedBW') == 'True':
        certifiedBW = True
    else:
        certifiedBW = False

    if request.form.get('willSubRA') == 'True':
        willSubRA = True
    else:
        willSubRA = False

    if request.form.get('willSubBW') == 'True':
        willSubBW = True
    else:
        willSubBW = False

    RAmonitorTrainingDate = request.form.get('RAmonitorTrainingDate')    
    BWmonitorTrainingDate = request.form.get('BWmonitorTrainingDate')    
    
    typeOfWork = request.form.get('typeOfWorkHidden')
     
    waiverExpirationDate = request.form.get('waiverExpirationDate')
    waiverReason = request.form.get('waiverReason')

    # GET MEMBER RECORD 
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    fieldsChanged = 0
     
    if certifiedRA != member.Certified:
        logChange('Certified RA',memberID,certifiedRA,member.Certified)
        member.Certified = certifiedRA
        fieldsChanged += 1

    if certifiedBW != member.Certified_2:
        logChange('Certified BW',memberID,certifiedBW,member.Certified_2)
        member.Certified_2 = certifiedBW
        fieldsChanged += 1

    if certifiedRAdate != member.Certification_Training_Date:
        logChange('RA certification',memberID,certifiedRAdate,member.Certification_Training_Date)
        if certifiedRAdate == '':
            member.Certification_Training_Date = None
        else:
            member.Certification_Training_Date = certifiedRAdate
        fieldsChanged += 1
    
    if certifiedBWdate != member.Certification_Training_Date_2:
        logChange('BW certification',memberID,certifiedBWdate,member.Certification_Training_Date_2)
        if certifiedBWdate == '':
            member.Certification_Training_Date_2 = None
        else:
            member.Certification_Training_Date_2 = certifiedBWdate
        fieldsChanged += 1

    if willSubRA != member.Monitor_Sub:
        logChange('Will sub RA',memberID,willSubRA,member.Monitor_Sub)
        member.Monitor_Sub = willSubRA
        fieldsChanged += 1

    if willSubBW != member.Monitor_Sub_2:
        logChange('Will sub BW',memberID,willSubBW,member.Monitor_Sub_2)
        member.Monitor_Sub_2 = willSubBW
        fieldsChanged += 1

    if RAmonitorTrainingDate != member.Last_Monitor_Training:
        logChange('RA Monitor Training',memberID,RAmonitorTrainingDate,member.Last_Monitor_Training)
        if RAmonitorTrainingDate == '':
            member.Last_Monitor_Training = None
        else:
            member.Last_Monitor_Training = RAmonitorTrainingDate
        fieldsChanged += 1
     
    if BWmonitorTrainingDate != member.Last_Monitor_Training_Shop_2:
        logChange('BW Monitor Training',memberID,BWmonitorTrainingDate,member.Last_Monitor_Training_Shop_2)
        if BWmonitorTrainingDate == '':
            member.Last_Monitor_Training_Shop_2 = None
        else:
            member.Last_Monitor_Training_Shop_2 = BWmonitorTrainingDate
        fieldsChanged += 1
    
    if typeOfWork != None:
        if typeOfWork != member.Default_Type_Of_Work:
            logChange('Default_Type_Of_Work',memberID,typeOfWork,member.Default_Type_Of_Work)
            member.Default_Type_Of_Work = typeOfWork
            fieldsChanged += 1

    if waiverExpirationDate != member.Monitor_Duty_Waiver_Expiration_Date:
        logChange('Monitor Waiver Expiration',memberID,waiverExpirationDate,member.Monitor_Duty_Waiver_Expiration_Date)
        if waiverExpirationDate == '':
            member.Monitor_Duty_Waiver_Expiration_Date = None
        else:
            member.Monitor_Duty_Waiver_Expiration_Date = waiverExpirationDate
        fieldsChanged += 1

    if waiverReason != member.Monitor_Duty_Waiver_Reason:
        logChange('Monitor Waiver Reason',memberID,waiverReason,member.Monitor_Duty_Waiver_Reason)
        if waiverReason == '':
            member.Monitor_Duty_Waiver_Reason = None
        else:
            member.Monitor_Duty_Waiver_Reason = waiverReason
        fieldsChanged += 1

    if fieldsChanged > 0:
        try:
            db.session.commit()
            flash("Changes successful","success")
            return redirect(url_for('index',villageID=memberID))
        except SQLAlchemyError as e:
            error = str(e.__dict__['orig'])
            flash('ERROR - Record not added.'+error,'danger')
            return redirect(url_for('index',villageID=memberID))
        except Exception as e:
            flash("ERROR - Certification Info - Could not update certification data.","danger")
            db.session.rollback()
            return redirect(url_for('index',villageID=memberID))
    return redirect(url_for('index',villageID=memberID))


@app.route('/saveMonitorDuty', methods=['POST'])
def saveMonitorDuty():
    staffID = getStaffID()

    # GET DATA FROM FORM
    memberID = request.form['memberID']
    
    # DID USER CANCEL?
    if request.form['monitorAction'] == 'CANCEL':
        return redirect(url_for('index',villageID=memberID))

    # RETRIEVE MEMBER RECORD 
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    fieldsChanged = 0
    
    if request.form.get('jan') == 'True':
        jan = True
    else:
        jan = False
    if member.Jan_resident != jan:
        logChange('Jan',memberID,jan,member.Jan_resident)
        member.Jan_resident = jan
        fieldsChanged += 1

    if request.form.get('feb') == 'True':
        feb = True
    else:
        feb = False
    if member.Feb_resident != feb:
        logChange('Feb',memberID,feb,member.Feb_resident)
        member.Feb_resident = feb
        fieldsChanged += 1

    if request.form.get('mar') == 'True':
        mar = True
    else:
        mar = False
    if member.Mar_resident != mar:
        logChange('Mar',memberID,mar,member.Mar_resident)
        member.Mar_resident = mar
        fieldsChanged += 1

    if request.form.get('apr') == 'True':
        apr = True
    else:
        apr = False
    if member.Apr_resident != apr:
        logChange('Apr',memberID,apr,member.Apr_resident)
        member.Apr_resident = apr
        fieldsChanged += 1

    if request.form.get('may') == 'True':
        may = True
    else:
        may = False
    if member.May_resident != may:
        logChange('may',memberID,may,member.May_resident)
        member.May_resident = may
        fieldsChanged += 1

    if request.form.get('jun') == 'True':
        jun = True
    else:
        jun = False
    if member.Jun_resident != jun:
        logChange('Jun',memberID,jun,member.Jun_resident)
        member.Jun_resident = jun
        fieldsChanged += 1

    if request.form.get('jul') == 'True':
        jul = True
    else:
        jul = False
    if member.Jul_resident != jul:
        logChange('Jul',memberID,jul,member.Jul_resident)
        member.Jul_resident = jul
        fieldsChanged += 1

    if request.form.get('aug') == 'True':
        aug = True
    else:
        aug = False
    if member.Aug_resident != aug:
        logChange('Aug',memberID,aug,member.Aug_resident)
        member.Aug_resident = aug
        fieldsChanged += 1

    if request.form.get('sep') == 'True':
        sep = True
    else:
        sep = False
    if member.Sep_resident != sep:
        logChange('Sep',memberID,sep,member.Sep_resident)
        member.Sep_resident = sep
        fieldsChanged += 1

    if request.form.get('oct') == 'True':
        oct = True
    else:
        oct = False
    if member.Oct_resident != oct:
        logChange('Oct',memberID,oct,member.Oct_resident)
        member.Oct_resident = oct
        fieldsChanged += 1

    if request.form.get('nov') == 'True':
        nov = True
    else:
        nov = False
    if member.Nov_resident != nov:
        logChange('Nov',memberID,nov,member.Nov_resident)
        member.Nov_resident = nov
        fieldsChanged += 1

    if request.form.get('dec') == 'True':
        dec = True
    else:
        dec = False
    if member.Dec_resident != dec:
        logChange('Dec',memberID,dec,member.Dec_resident)
        member.Dec_resident = dec
        fieldsChanged += 1

    if request.form.get('needsToolCrib') == 'True':
        needsToolCrib = True
    else:
        needsToolCrib = False

    if member.Requires_Tool_Crib_Duty != needsToolCrib:
        logChange('Requires Tool Crib Duty',memberID,needsToolCrib,member.Requires_Tool_Crib_Duty)
        member.Requires_Tool_Crib_Duty = needsToolCrib
        fieldsChanged += 1

    monitorDutyNotes = request.form.get('monitorDutyNotes')
    if len(monitorDutyNotes) > 255:
        flash ('Monitor duty notes may not exceed 255 characters.','danger')
    else:    
        if member.Monitor_Duty_Notes != monitorDutyNotes:
            logChange('Monitor Duty Notes',memberID,monitorDutyNotes,member.Monitor_Duty_Notes)
            member.Monitor_Duty_Notes = monitorDutyNotes
            fieldsChanged += 1
   
    try:
        db.session.commit()
        flash("Changes successful","success")
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        print('error - ',error)
        return error
    except pyodbc.Error as err:
        print('err - ',err)
        flash("pyodbc error in monitor duty routine.")
        return redirect(url_for('index',villageID=memberID))
    except Exception as e:
        print('e - ',e)
        flash("Could not update monitor duty data.","danger")
        db.session.rollback()
    
    return redirect(url_for('index',villageID=memberID))

@app.route("/getNoteToMember")
def getNoteToMember():
    memberID = request.args.get('memberID')
    currentNote = db.session.query(NotesToMembers.noteToMember).filter(NotesToMembers.memberID == memberID).scalar()
    todays_date = datetime.today()
    todaySTR = todays_date.strftime('%m-%d-%Y')
    if (currentNote):
        msg = currentNote
        msg += '\n' + todaySTR + '\n'
    else:
        msg = todaySTR + '\n'
    
    return jsonify(msg=msg)


@app.route("/getNoteToStaff")
def getNoteToStaff():
    staffNote = db.session.query(ControlVariables.Message_Board).filter(ControlVariables.Shop_Number == 1).scalar()
    if (staffNote):
        msg = staffNote
    else:
        msg = ''
    return jsonify(msg=msg)

@app.route("/processNoteToMember")
def processNoteToMember():
    todays_date = datetime.today()
    todaySTR = todays_date.strftime('%m-%d-%Y')
    
    showAtCheckIn=request.args.get('showAtCheckIn')
    sendEmail=request.args.get('sendEmail')
    memberID=request.args.get('memberID')
    
    currentMsg = request.args.get('msg')
    response = ""

    # PREPARE A NOTE TO DISPLAY AT CHECK-IN, IF REQUESTED
    if (showAtCheckIn == 'true'):
        currentNote = db.session.query(NotesToMembers).filter(NotesToMembers.memberID == memberID).first()
        if (currentNote != None):
            db.session.delete(currentNote)
            db.session.commit()

        # CREATE A NEW MSG RECORD; ANY OLD DATA WILL REMAIN AT BEGINNING OF MESSAGE.
        try:
            newNote = NotesToMembers(
                memberID = memberID, 
                noteToMember = currentMsg)
            db.session.add(newNote)
            db.session.commit()
            response = "New note successfully created!"
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return make_response(f"ERROR - Could not add a new note.")
    
    
    if (sendEmail != 'true'):
        return make_response (f"{response}")
    
    # PREPARE AN EMAIL, IF REQUESTED
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if (member.eMail == None or member.eMail == ''):
        response += "ERROR - No email address."
        return make_response (f"{response}")
    emailAddress = member.eMail
    displayName = member.First_Name + ' ' + member.Last_Name

    sender = app.config['MAIL_USERNAME']
    password = app.config['MAIL_PASSWORD']
    
    recipient = emailAddress
    subject = 'Message to ' + displayName
    message = currentMsg

    msg = MIMEMultipart()
    msg['From'] = sender
    msg['To'] = recipient
    msg['Subject']=subject

    # Attach the message to the MIMEMultipart object
    msg.attach(MIMEText(message, 'plain'))
    
    #server = smtplib.SMTP('outlook.office365.com',587)
    server = smtplib.SMTP(app.config['MAIL_SERVER'],app.config['MAIL_PORT'])
    server.starttls()
    server.login(sender,password)
    text = msg.as_string() # Convert the MIMEMultipart object to a string to send
    server.sendmail(sender,recipient,text)
    server.quit()

    response += "\nEmail sent."
    return make_response (f"{response}")



@app.route("/saveStaffMsg")
def saveStaffMsg():
    todays_date = datetime.today()
    todaySTR = todays_date.strftime('%m-%d-%Y')
    msg = request.args.get('msg')
    response = ""

    # SAVE UPDATED STAFF NOTE
    ctrlVar = db.session.query(ControlVariables).filter(ControlVariables.Shop_Number == 1).first()
    if (ctrlVar != None):
        try:
            ctrlVar.Message_Board = msg
            db.session.commit()
            response = "Staff note successfully updated!"
            
        except SQLAlchemyError as e:
            db.session.rollback()
            return make_response(f"ERROR - Could not add a new note.")

        return make_response (f"{response}")
    else:
        response = 'ERROR - could not update.'
        return make_response (f"{response}")

@app.route("/getPassword")
def getPassword():
    memberID = request.args.get('memberID')
    password = db.session.query(Member.Password).filter(Member.Member_ID == memberID).scalar()
    if (password == None):
        password = 'Error - ' + 'Password not available.'
    return jsonify(password=password)


@app.route("/updatePassword")
def updatePassword():
    todays_date = datetime.today()
    todaySTR = todays_date.strftime('%m-%d-%Y')
    
    memberID=request.args.get('memberID')
    curPassword = request.args.get('curPassword')
    newPassword = request.args.get('newPassword')
    response = ""

    # GET MEMBER RECORD
    member = db.session.query(
        Member).filter(Member.Member_ID == memberID).first()
    if member == None:
        flash ('Error - member ID '+memberID + ' was not found.','danger')
        return redirect(url_for('index',villageID=memberID))
    
    try:
        member.Password = newPassword
        db.session.commit()
        response = "Password changed."
        #flash ('Password changed.','success')   
    except SQLAlchemyError as e:
        db.session.rollback()
        return make_response(f"ERROR - Could not update password.")

    return make_response (f"{response}")

def logChange(colName,memberID,newData,origData):
    staffID = getStaffID()
    if staffID == None or staffID == '':
        flash('Missing staffID in logChange routine.','danger')
        staffID = '111111'

    # CHECK FOR STRINGS > 50 CHARACTERS (could change field size to 255)
    if isinstance(newData,str):
        if len(newData) > 50:
            newData = newData[0:50]
            
    if isinstance(origData,str):        
        if len(origData) > 50:
            origData = origData[0:50]
            
    #  GET UTC TIME
    est = timezone('America/New_York')
    # Write data changes to tblMember_Data_Transactions
    try:
        newTransaction = MemberTransactions(
            Transaction_Date = datetime.now(est),
            Member_ID = memberID,
            Staff_ID = staffID,
            Original_Data = origData,
            Current_Data = newData,
            Data_Item = colName,
            Action = 'UPDATE'
        )
        db.session.add(newTransaction)
        db.session.commit()
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        flash('Transaction could not be logged.\n'+error,'danger')
        db.session.rollback()

@app.route("/newMemberApplication",methods=('GET', 'POST'))
def newMemberApplication():
    staffID = getStaffID()
    
    # GATHER DATA FOR NEW MEMBER FORM
    if request.method != 'POST':
        todays_date = date.today()
        todaySTR = todays_date.strftime('%m-%d-%Y')
        # PREPARE LIST OF AVAILABLE CERTIFICATION DATES FOR ROLLING ACRES
        sqlSelect = "SELECT trainingDate, classLimit FROM tblTrainingDates "
        sqlSelect += "WHERE shopNumber = 1 "
        sqlSelect += "and trainingDate >= '" + todaySTR + "';"
        RAclasses = db.engine.execute(sqlSelect)
        RAclassArray = []
        for RA in RAclasses:
            RAenrolled = db.session.query(func.count(Member.Member_ID)).filter(Member.Certification_Training_Date == RA.trainingDate).scalar()
            if RAenrolled < RA.classLimit:
                RAclassArray.append(RA.trainingDate.strftime('%m-%d-%Y'))
       
        RAavailableDates = len(RAclassArray)

        # PREPARE LIST OF VILLAGES
        sqlSelect = "SELECT Village_Name FROM tblValid_Village_Names "
        sqlSelect += "ORDER BY Village_Name"
        try:
            villages = db.engine.execute(sqlSelect)
        except Exception as e:
            flash("Could not retrieve village name list.","danger")
            return 'ERROR in index village function.'

        # GET ZIPCODES
        zipCodes = db.session.query(ZipCode).order_by(ZipCode.Zipcode).all()
   
        # PREPARE LIST OF AVAILABLE CERTIFICATION DATES FOR BROWNWOOD
        sqlSelect = "SELECT trainingDate, classLimit FROM tblTrainingDates "
        sqlSelect += "WHERE shopNumber = 2 "
        sqlSelect += "and trainingDate >= '" + todaySTR + "';"
        BWclasses = db.engine.execute(sqlSelect)
        BWclassArray = []
        for BW in BWclasses:
            BWenrolled = db.session.query(func.count(Member.Member_ID)).filter(Member.Certification_Training_Date_2 == BW.trainingDate).scalar()
            if BWenrolled < BW.classLimit:
                BWclassArray.append(BW.trainingDate.strftime('%m-%d-%Y'))
        BWavailableDates = len(BWclassArray)


        singleInitiationFee = db.session.query(ControlVariables.Current_Initiation_Fee).filter(ControlVariables.Shop_Number==1).scalar()
        annualFee = db.session.query(ControlVariables.Current_Dues_Amount).filter(ControlVariables.Shop_Number==1).scalar()
        singleInitiationFeeCUR =  "${:,.2f}".format(singleInitiationFee)
        annualFeeCUR =  "${:,.2f}".format(annualFee)
        familyInitiationFee = singleInitiationFee / 2
        familyInitiationFeeCUR = "${:,.2f}".format(familyInitiationFee)
        currentDuesYear = db.session.query(ControlVariables.Current_Dues_Year).filter(ControlVariables.Shop_Number == 1).scalar()
        
        singleTotalFee = singleInitiationFee + annualFee
        singleTotalFeeCUR = "${:,.2f}".format(singleTotalFee)
        familyTotalFee = familyInitiationFee + annualFee
        familyTotalFeeCUR = "${:,.2f}".format(familyTotalFee)

        return render_template("newMember.html",RAclassArray=RAclassArray,BWclassArray=BWclassArray,\
        RAavailableDates=RAavailableDates,BWavailableDates=BWavailableDates,\
        singleInitiationFeeCUR=singleInitiationFeeCUR,familyInitiationFeeCUR=familyInitiationFeeCUR,\
        annualFeeCUR=annualFeeCUR,currentDuesYear=currentDuesYear,dateJoined=todaySTR,\
        singleTotalFeeCUR=singleTotalFeeCUR,familyTotalFeeCUR=familyTotalFeeCUR,zipCodes=zipCodes,villages=villages)

    # POST REQUEST; PROCESS FORM DATA; IF OK SEND PAYMENT DATA, ADD TO MEMBER_DATA, INSERT TRANSACTION ('ADD'), DISPLAY MEMBER FORM
    
    if request.form['newMember'] == 'CANCEL':
        return redirect(url_for('index'))
    
    todays_date = datetime.today()
    todaySTR = todays_date.strftime('%m-%d-%Y')
    duesAmount = db.session.query(ControlVariables.Current_Dues_Amount).filter(ControlVariables.Shop_Number==1).scalar()
    memberInitiationFee = db.session.query(ControlVariables.Current_Initiation_Fee).filter(ControlVariables.Shop_Number==1).scalar()
    
    memberID = request.form.get('memberID')
    member = Member.query.filter_by(Member_ID=memberID).first()
    if member != None:
        flash("Member ID "+ memberID + " is already on file.",'success')
        return redirect(url_for('index',villageID=memberID,todaysDate=todaySTR))

    expireDate = request.form.get('expireDate')
    if expireDate:
        hasTempID = 1
    else:
        hasTempID = 0

    firstName = request.form.get('firstName')
    middleName = request.form.get('middleName')
    lastName = request.form.get('lastName')
    nickname = request.form.get('nickname')

    # CONSTRUCT NAMES   
    LFM_Name = lastName + ', ' + firstName + ' ' + middleName
    FML_Name = firstName
    if middleName != '':
        FML_Name += ' ' + middleName
    FML_Name += ' ' + lastName 
    LF_Name = lastName + ', ' + firstName
    LFN_Name = lastName + ', ' + firstName 
    if nickname != '':
        LFN_Name += ' (' + nickname + ')'
    FNL_Name = firstName 
    if nickname != '':
        FNL_Name += ' (' + nickname + ')'
    FNL_Name += ' ' + lastName
    Initials = firstName[0].lower()
    if middleName != '':
        Initials += middleName[0].lower()
    Initials += lastName[0].lower()

    
    street = request.form.get('street')
    zip = request.form.get('zip')
    village = request.form.get('village')
    
    cellPhone = request.form.get('cellPhone')
    homePhone = request.form.get('homePhone')
    eMail = request.form.get('eMail')
    dateJoined = request.form.get('dateJoined')
    # typeOfWork = request.form.get('typeOfWorkSelected')
    typeOfWork = 'General'

    skillLevel = request.form.get('skillLevel')

    certifyDateRA = request.form.get('certifyDateRA')
    certifyDateBW = request.form.get('certifyDateBW')

    membershipType = request.form.get('membershipType')
    if membershipType == 'single' :
        initiationFee = memberInitiationFee
    else:
        initiationFee = memberInitiationFee / 2

    currentDuesYear = db.session.query(ControlVariables.Current_Dues_Year).filter(ControlVariables.Shop_Number == 1).scalar()
   
    # VALIDATE DATA
    #    if temp id then set Temporary_Village_ID to true

    newMember = Member(
        Member_ID = memberID,
        Temporary_ID_Expiration_Date = expireDate,
        Temporary_Village_ID = hasTempID,
        First_Name = firstName,
        Middle_Name = middleName,
        Last_Name = lastName,
        Nickname = nickname,
        LFM_Name = LFM_Name,
        FML_Name = FML_Name,
        LF_Name = LF_Name,
        LFN_Name = LFN_Name,
        FNL_Name = FNL_Name,
        Initials = Initials,
        Address = street,
        City = 'The Villages',
        State = 'FL',
        Zip = zip,
        Village = village,
        Cell_Phone = cellPhone,
        Home_Phone = homePhone,
        eMail = eMail,
        Date_Joined = dateJoined,
        Default_Type_Of_Work = typeOfWork,
        Skill_Level = skillLevel,
        Certification_Training_Date = certifyDateRA,
        Certification_Training_Date_2 = certifyDateBW,
        Dues_Paid = 1,
        Jan_resident = 1,
        Feb_resident = 1,
        Mar_resident = 1,
        Apr_resident = 1,
        May_resident = 1,
        Jun_resident = 1,
        Jul_resident = 1,
        Aug_resident = 1,
        Sep_resident = 1,
        Oct_resident = 1,
        Nov_resident = 1,
        Dec_resident = 1,
        Villages_Waiver_Signed = 1,
        Villages_Waiver_Date_Signed = todays_date
    ) 
    
    # ADD TO tblMember_Data TABLE
    try:
        db.session.add(newMember)
        db.session.commit()
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        flash('ERROR - '+error,'danger')
        db.session.rollback()

    #  GET UTC TIME 
    est = timezone('America/New_York')
    newTransaction = MemberTransactions(
        Transaction_Date = datetime.now(est),
        Member_ID = memberID,
        Staff_ID = staffID,
        Original_Data = '',
        Current_Data = memberID,
        Data_Item = 'NEW MEMBER',
        Action = 'NEW'
    )

    # ADD RECORD TO tblDues_Years_Paid TABLE
    # GET UTC TIME
    est = timezone('America/New_York')
    try:
        newDuesPaidYear = DuesPaidYears(
            Member_ID = memberID,
            Dues_Year_Paid = currentDuesYear,
            Date_Dues_Paid = datetime.now(est)
        )
        db.session.add(newDuesPaidYear)
        db.session.commit()

    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        flash('ERROR - '+error,'danger')
        db.session.rollback()
    
    # WRITE TO MEMBER_TRANSACTION TABLE
    try:
        db.session.add(newTransaction)
        db.session.commit() 
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        flash('ERROR - '+error,'danger')
        db.session.rollback()

    # SEND REQUEST FOR PAYMENT TO LIGHTSPEED

    # DISPLAY NEW MEMBER RECORD SO STAFF CAN ENTER REMAINING DATA
    flash("New member added successfully.","success")
    return redirect(url_for('index',villageID=memberID,todaysDate=todaySTR))
    
@app.route("/acceptDues")
def acceptDues():
   
    initiationFee = db.session.query(ControlVariables.Current_Initiation_Fee).filter(ControlVariables.Shop_Number == 1).scalar()
    initiationFeeAcct = db.session.query(ControlVariables.Initiation_Fee_Account).filter(ControlVariables.Shop_Number == 1).scalar()
    duesAmount = db.session.query(ControlVariables.Current_Dues_Amount).filter(ControlVariables.Shop_Number==1).scalar()
    memberID=request.args.get('memberID')
    
    duesAccount = db.session.query(ControlVariables.Dues_Account).filter(ControlVariables.Shop_Number==1).scalar()
    currentDuesYear = db.session.query(ControlVariables.Current_Dues_Year).filter(ControlVariables.Shop_Number == 1).scalar()
   
    todays_date = datetime.today()
    todaySTR = todays_date.strftime('%m-%d-%Y')

    # SET DUES PAID FLAG
    try:
        member = Member.query.filter_by(Member_ID=memberID).first()
        member.Dues_Paid = True
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        flash('ERROR - '+error,'danger')
        db.session.rollback()
        
    # ADD RECORD TO tblDues_Paid_Years
    # GET UTC TIME  
    est = timezone('America/New_York')
    try:
        newDuesPaidYear = DuesPaidYears(
            Member_ID = memberID,
            Dues_Year_Paid = currentDuesYear,
            Date_Dues_Paid = datetime.now(est)
        )
        db.session.add(newDuesPaidYear)
        db.session.commit()

    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        flash('ERROR - '+error,'danger')
        db.session.rollback()
        return make_response(f"ERROR - Could not process payment.\n" + error)

    flash ("SUCCESS - Payment processed","success")
    return make_response(f"SUCCESS - Payment processed")


@app.route('/roles/')  
def roles():
    staffID = getStaffID()
    memberID = request.args.get('villageID')
    if (memberID == ''):
        flash("You must select a member first.","info")
        return
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if (member == None):
        flash ("No member match for roles.",'danger')
        return render_template("roles.html",member='')
        #return redirect(url_for('index'))
    return render_template("roles.html",member=member)


@app.route('/checkIns/')   
def checkIns():
    staffID = getStaffID()
    memberID = request.args.get('villageID')
    if (memberID == ''):
        flash("You must select a member first.","info")
        return

    todaysDate = date.today()
    todaySTR = todaysDate.strftime('%m-%d-%Y')
    startDate = todaysDate - timedelta(days=730)
    
    activity = db.session.query(MemberActivity)\
    .filter(MemberActivity.Member_ID == memberID)\
    .order_by(MemberActivity.Check_In_Date_Time.desc())\
    .all()
    #.filter(MemberActivity.Check_In_Date_Time > startDate)\
    
    activityDict = []
    activityItem = []
    for a in activity:
        shopName = db.session.query(ShopName.Shop_Name).filter(ShopName.Shop_Number == a.Shop_Number).scalar()
        if shopName == None:
            shopName = ''
        if a.Check_In_Date_Time != None:
            checkIn = a.Check_In_Date_Time.strftime("%m-%d-%Y %I:%M %p")
            checkInDate = a.Check_In_Date_Time.strftime("%m-%d-%Y")
            checkInTime = a.Check_In_Date_Time.strftime("%I:%M %p")
        else:
            checkIn = ''
            checkInDate = ''
            checkInTime = ''

        if a.Check_Out_Date_Time != None:
            checkOut = a.Check_Out_Date_Time.strftime("%m-%d-%Y  %I %M %p")
            checkOutDate = a.Check_Out_Date_Time.strftime("%m-%d-%Y")
            checkOutTime = a.Check_Out_Date_Time.strftime("%I %M %p")
        else:
            checkOut = ''
            checkOutDate = ''
            checkOutTime = ''

        activityItem = {
            'checkIn':checkIn, 
            'checkInDate':checkInDate,
            'checkInTime':checkInTime,
            'checkOut':checkOut,
            'checkOutDate':checkOutDate,
            'checkOutTime':checkOutTime,
            'typeOfWork':a.Type_Of_Work,
            'shopName':shopName
        }
        activityDict.append(activityItem)
    #.order_by(MemberActivity.Check_In_Date_Time.desc).all()

    # if (activity == None):
    #     flash ("No member match for check-ins.",'info')
    #     return redirect(url_for('index',villageID=memberID,todaysDate=todaySTR))

    return render_template("checkIns.html",activityDict=activityDict,memberID=memberID)

@app.route('/saveRoles', methods=['POST'])
def saveRoles():
    staffID = getStaffID()
    
    memberID = request.form['memberID']
   
    # GET DATA FROM FORM
    if request.form.get('askMe') == 'True':
        askMe = True
    else:
        askMe = False

    if request.form.get('mentor') == 'True':
        mentor = True
    else:
        mentor = False

    if request.form.get('bod') == 'True':
        bod = True
    else:
        bod = False
    
    if request.form.get('mdse') == 'True':
        mdse = True
    else:
        mdse = False

    if request.form.get('certification') == 'True':
        certification = True
    else:
        certification = False

    if request.form.get('staff') == 'True':
        staff = True
    else:
        staff = False

    if request.form.get('DBA') == 'True':
        DBA = True
    else:
        DBA = False

    if request.form.get('monitorCoordinator') == 'True':
        monitorCoordinator = True
    else:
        monitorCoordinator = False
    
    if request.form.get('instructor') == 'True':
        instructor = True
    else:
        instructor = False

    if request.form.get('president') == 'True':
        president = True
    else:
        president = False

    if request.form.get('lumber') == 'True':
        lumber = True
    else:
        lumber = False

    if request.form.get('safety') == 'True':
        safety = True
    else:
        safety = False

    if request.form.get('maintenance') == 'True':
        maintenance = True
    else:
        maintenance = False

    if request.form.get('specProj') == 'True':
        specProj = True
    else:
        specProj = False

    if request.form.get('mgr') == 'True':
        mgr = True
    else:
        mgr = False

    if request.form.get('vp') == 'True':
        vp = True
    else:
        vp = False
    
    # RETRIEVE MEMBER RECORD
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    
    # HAVE ANY FIELDS CHANGED?
    fieldsChanged = 0
    if member.isAskMe != askMe:
        member.isAskMe = askMe
        logChange('isAskMe',memberID,askMe,member.isAskMe)
        fieldsChanged += 1 

    if member.Mentor != mentor:
        member.Mentor = mentor
        logChange('Mentor',memberID,mentor,member.Mentor)
        fieldsChanged += 1 

    if member.isBODmember != bod:
        member.isBODmember = bod
        logChange('isBODmember',memberID,bod,member.isBODmember)
        fieldsChanged += 1 

    if member.canSellMdse != mdse:
        member.canSellMdse = mdse
        logChange('canSellMdse',memberID,mdse,member.canSellMdse)
        fieldsChanged += 1 

    if member.Certification_Staff != certification:
        member.Certification_Staff = certification
        logChange('Certification_Staff',memberID,certification,member.Certification_Staff)
        fieldsChanged += 1 

    if member.Office_Staff != staff:
        member.Office_Staff = staff
        logChange('Office_Staff',memberID,staff,member.Office_Staff)
        fieldsChanged += 1 

    if member.DBA != DBA:
        member.DBA = DBA
        logChange('DBA',memberID,DBA,member.DBA)
        fieldsChanged += 1 

    if member.Monitor_Coordinator != monitorCoordinator:
        member.Monitor_Coordinator = monitorCoordinator
        logChange('Monitor_Coordinator',memberID,monitorCoordinator,member.Monitor_Coordinator)
        fieldsChanged += 1 

    if member.Instructor != instructor:
        member.Instructor = instructor
        logChange('Instructor',memberID,instructor,member.Instructor)
        fieldsChanged += 1 

    if member.isPresident != president:
        member.isPresident = president
        logChange('isPresident',memberID,president,member.isPresident)
        fieldsChanged += 1 

    if member.canSellLumber != lumber:
        member.canSellLumber = lumber
        logChange('canSellLumber',memberID,lumber,member.canSellLumber)
        fieldsChanged += 1 

    if member.isSafetyCommittee != safety:
        member.isSafetyCommittee = safety
        logChange('isSafetyCommittee',memberID,safety,member.isSafetyCommittee)
        fieldsChanged += 1 

    if member.Maintenance != maintenance:
        member.Maintenance = maintenance
        logChange('Maintenance',memberID,maintenance,member.Maintenance)
        fieldsChanged += 1 

    if member.isSpecialProjects != specProj:
        member.isSpecialProjects = specProj
        logChange('isSpecialProjects',memberID,specProj,member.isSpecialProjects)
        fieldsChanged += 1 

    if member.Manager != mgr:
        member.Manager = mgr
        logChange('Manager',memberID,mgr,member.Manager)
        fieldsChanged += 1 

    if member.isVP != vp:
        member.isVP = vp
        logChange('isVP',memberID,vp,member.isVP)
        fieldsChanged += 1 


    # IF ANY FIELDS CHANGED, SAVE CHANGES
    if fieldsChanged > 0:
        try:
            db.session.commit()
            flash("Changes successful","success")
        except Exception as e:
            flash("Could not update member role data.","danger")
            db.session.rollback()

    return redirect(url_for('index',villageID=memberID))


# PRINT MEMBER MONITOR DUTY SCHEDULE
@app.route("/printMemberSchedule/", methods=['GET','POST'])
def printMemberSchedule():
    todays_date = date.today()
    todays_dateSTR = todays_date.strftime('%m-%d-%Y')

    memberID = request.args.get('villageID')
    # GET MEMBER NAME
    member = db.session.query(Member).filter(Member.Member_ID== memberID).first()
    displayName = member.First_Name + ' ' + member.Last_Name
    lastTrainingRA = member.Last_Monitor_Training
    lastTrainingBW = member.Last_Monitor_Training_Shop_2
    
        
    # RETRIEVE LAST_ACCEPTABLE_TRAINING_DATE FROM tblControl_Variables
    lastAcceptableTrainingDate = db.session.query(ControlVariables.Last_Acceptable_Monitor_Training_Date).filter(ControlVariables.Shop_Number == '1').scalar()
    if lastTrainingRA == None:
        needsTrainingRA = 'Y'
    else:
        if (lastTrainingRA < lastAcceptableTrainingDate):
            needsTrainingRA = 'Y'
        else:
            needsTrainingRA = 'N'
    if lastTrainingBW == None:
        needsTrainingBW = 'Y'
    else:
        if (lastTrainingBW < lastAcceptableTrainingDate):
            needsTrainingBW = 'Y'
        else:
            needsTrainingBW = 'N'
    if lastTrainingRA != None:
        lastTrainingRAstr = lastTrainingRA.strftime('%m-%d-%Y')
    else:
        lastTrainingRAstr = ''
    if lastTrainingBW != None:
        lastTrainingBWstr = lastTrainingBW.strftime('%m-%d-%Y')
    else:
        lastTrainingBWstr = ''

    thisYear = db.session.query(ControlVariables.monitorYear).filter(ControlVariables.Shop_Number==1).scalar()
    lastYear = str(int(thisYear)-1)
   
    # RETRIEVE MEMBER SCHEDULE FOR CURRENT YEAR AND FORWARD
    
    # BUILD SELECT STATEMENT TO RETRIEVE MEMBERS SCHEDULE FOR SPECIFIED YEAR
    sqlSelect = "SELECT tblMember_Data.Member_ID as memberID, "
    sqlSelect += "First_Name + ' ' + Last_Name as displayName, tblShop_Names.Shop_Name, "
    sqlSelect += "Last_Monitor_Training as trainingDateRA, Last_Monitor_Training_Shop_2 as trainingDateBW, tblMonitor_Schedule.Member_ID, "
    sqlSelect += " format(Date_Scheduled,'MMM d, yyyy') as DateScheduled, AM_PM, Duty, No_Show, tblMonitor_Schedule.Shop_Number "
    sqlSelect += "FROM tblMember_Data "
    sqlSelect += "LEFT JOIN tblMonitor_Schedule ON tblMonitor_Schedule.Member_ID = tblMember_Data.Member_ID "
    sqlSelect += "LEFT JOIN tblShop_Names ON tblMonitor_Schedule.Shop_Number = tblShop_Names.Shop_Number "
    sqlSelect += "WHERE tblMember_Data.Member_ID = '" + memberID + "' "
    sqlSelect += "and DatePart(year,[Date_Scheduled]) = '" + thisYear + "' "
    sqlSelect += "ORDER BY Date_Scheduled, AM_PM, Duty"

    schedule = db.engine.execute(sqlSelect)
    
    return render_template("rptMemberSchedule.html",displayName=displayName,\
    lastTrainingRA=lastTrainingRAstr, needsTrainingRA=needsTrainingRA,\
    lastTrainingBW=lastTrainingBWstr, needsTrainingBW=needsTrainingBW,\
    schedule=schedule,todays_date=todays_dateSTR,thisYear=thisYear,lastYear=lastYear)

@app.route("/shiftChange")
def shiftChange():
    #staffID = request.args.get('staffID')
    session.pop('staffID',None)
    session['staffID'] = request.args.get('staffID')
    staffID = session['staffID']
    staffMember = db.session.query(Member).filter(Member.Member_ID == staffID).first()
    if staffMember == None:
        msg = "Not a valid member ID."
    else:
        memberName = staffMember.First_Name + '' + staffMember.Last_Name
        if staffMember.Office_Staff or staffMember.DBA or staffMember.Manager :
            msg = "Authorized"
        else:
            msg = memberName + " is not authorized to use this application."
    return jsonify(msg=msg)


@app.route('/editName/')  
def editName():
    staffID = getStaffID()
    memberID = request.args.get('villageID')
    if (memberID == ''):
        flash("You must select a member first.","info")
    
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if (member == None):
        flash ("No member match for name change.",'danger')
        return redirect(url_for('index'))
    return render_template("editName.html",member=member)

@app.route('/saveName', methods=['POST'])
def saveName():
    staffID = request.form['staffID']
    
    #  GET MEMBER ID
    memberID = request.form['memberID']
    
    # RETRIEVE MEMBER RECORD
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if member == None:
        flash('Member for name edit was not found.','danger')
        return redirect(url_for('index'))

    # GET DATA FROM FORM
    firstName = request.form.get('firstName')
    middleName = request.form.get('middleName')
    lastName = request.form.get('lastName')
    nickName = request.form.get('nickName')
  
    # HAVE ANY FIELDS CHANGED?
    fieldsChanged = 0
    if member.First_Name != firstName:
        logChange('First name',memberID,firstName,member.First_Name)
        member.First_Name = firstName
        fieldsChanged += 1 
    # print('length - ',len(middleName))
    # print('middleName - |',member.Middle_Name,'|',middleName,'|')
    # if (middleName == None):
    #     middleName = Null
    # print('middleName - |',member.Middle_Name,'|',middleName,'|')
    if member.Middle_Name != middleName:
        logChange('Middle name',memberID,middleName,member.Middle_Name)
        # print('name is changed')
        # print('length - ',len(middleName))

        member.Middle_Name = middleName
        fieldsChanged += 1 

    if member.Last_Name != lastName:
        logChange('Last name',memberID,lastName,member.Last_Name)
        member.Last_Name = lastName
        fieldsChanged += 1 

    if member.Nickname != nickName:
        logChange('Nick name',memberID,nickName,member.Nickname)
        member.Nickname = nickName
        fieldsChanged += 1

    # CONSTRUCT LF_Name
    member.LF_Name = lastName + ', ' + firstName

    # CONSTRUCT LFM_Name 
    member.LFM_Name = lastName + ', '+firstName 
    if middleName != None and middleName != '':
        member.LFM_Name += ' ' + middleName

    # CONSTRUCT LFN_Name
    member.LFN_Name = lastName + ', '+firstName
    if nickName != None and nickName != '':
        member.LFN_Name +=  ' (' + nickName + ')'

    # CONSTRUCT FML_Name
    member.FML_Name = firstName
    if middleName != None and middleName != '':
        member.FML_Name += ' ' + middleName
    member.FML_Name += ' ' + lastName
    
    # CONSTRUCT FLN_Name
    member.FNL_Name = firstName
    if nickName != None and nickName != '':
        member.FNL_Name += ' (' + nickName
    member.FNL_Name += ') ' + lastName

    # CONSTRUCT Initials
    member.Initials = firstName[0:1].lower()
    if middleName != None and middleName != '':
        member.Initials += middleName[0:1].lower()
    member.Initials += lastName[0:1].lower()

    # IF ANY FIELDS CHANGED, SAVE CHANGES
    if fieldsChanged > 0:
        try:
            db.session.commit()
            flash("Changes successful","success")
        except Exception as e:
            flash("Could not update member name data.","danger")
            db.session.rollback()

    return redirect(url_for('index',villageID=memberID))


@app.route('/changeVillageID/')  
def changeVillageID():
    staffID = getStaffID()
    memberID = request.args.get('villageID')
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()

    # if (memberID == ''):
    #     flash("You must select a member first.","info")
    #     return redirect(url_for('index'))

    if memberID == staffID:
        flash("You may not change the id of the user that is logged in.",'danger')
        return render_template("chgVillageID.html",member=member)
        #return redirect(url_for('index'))

    if (member == None):
        flash ("No member match for Village ID change.",'danger')
        return redirect(url_for('index'))
    return render_template("chgVillageID.html",member=member)

@app.route('/saveVillageID', methods=['POST'])
def saveVillageID():
    #  GET DATA FROM FORM
    curVillageID = request.form.get('memberID')
    staffID = request.form.get('staffID')
    newVillageID = request.form.get('newVillageID')
   
    # IF THERE IS A CHANGE TO THE MEMBER ID, CHECK TO SEE IF THE NEW NUMBER IS IN USE
    if newVillageID != None and newVillageID != '':
        memberExists = db.session.query(Member).filter(Member.Member_ID == newVillageID).first()
        if memberExists != None:
            flash('The ID# '+newVillageID +' is already assigned to another member.','info')
            db.session.close()
            return redirect(url_for('changeVillageID',memberID=curVillageID))

    # GET THE CURRENT MEMBER RECORD
    member = db.session.query(Member).filter(Member.Member_ID == curVillageID).first()
    if (member == None):
        flash("Record for member "+ curVillageID + ' is missing.','danger')
        return redirect(url_for('index',villageID=curVillageID))
     
    # CHANGE THE MEMBER ID (VILLAGE ID)
    if curVillageID != newVillageID:
        # CHANGE VILLAGE ID IN tblMember_Data; SQL SERVER WILL CASCADE CHANGE OF MEMBER_ID
        #
        #  THIS APPROACH RELIES UPON SQL SERVER CASCADE UPDATES OF RELATED TABLES !!!
        #
        try:
            member.Member_ID = newVillageID
            db.session.commit()
            logChange('Village ID changed',curVillageID,newVillageID,curVillageID)  
            flash("Village ID change successful","success")
        except SQLAlchemyError as e:
            error = str(e.__dict__['orig'])
            flash('ERROR - '+error,'danger')
            flash("Could not change village ID.","danger")
            db.session.rollback()
            return redirect(url_for('index',villageID=curVillageID))

    return redirect(url_for('index',villageID=newVillageID))
   


   
@app.route("/takePhoto/")
def takePhoto():
    villageID = request.args.get('villageID')
    return render_template("photo.html",memberID=villageID)

@app.route("/newVolunteerApplication",methods=('GET', 'POST'))
def newVolunteerApplication():
    staffID = getStaffID()

    todays_date = date.today()
    todaySTR = todays_date.strftime('%m-%d-%Y')
    
    # DISPLAY BLANK NEW VOLUNTEER FORM
    if request.method != 'POST':
        # PREPARE LIST OF VILLAGES
        sqlSelect = "SELECT Village_Name FROM tblValid_Village_Names "
        sqlSelect += "ORDER BY Village_Name"
        try:
            villages = db.engine.execute(sqlSelect)
        except Exception as e:
            flash("Could not retrieve village name list.","danger")
            return 'ERROR in index village function.'

        # GET ZIPCODES
        zipCodes = db.session.query(ZipCode).order_by(ZipCode.Zipcode).all()
        return render_template("newVolunteer.html",zipCodes=zipCodes,villages=villages)

    # DID USER CANCEL?
    if request.form.get('volunteerCancelBtn') == 'CANCEL':
        return redirect(url_for('index',todaysDate=todaySTR))

    # COLLECT DATA FROM FORM
    villageID = request.form.get('villageID')
    member = Member.query.filter_by(Member_ID=villageID).first()
    if member != None:
        flash("Village ID "+villageID + " is already on file.",'danger')
        return redirect(url_for('index',villageID=villageID,todaysDate=todaySTR))

    # PROCESS NEW VOLUNTEER
    expireDate = request.form.get('expireDate')
    if expireDate:
        hasTempID = 1
    else:
        hasTempID = 0

    firstName = request.form.get('firstName')
    middleName = request.form.get('middleName')
    lastName = request.form.get('lastName')
    nickname = request.form.get('nickname')
    street = request.form.get('street')
    city = request.form.get('city')
    state = request.form.get('state')
    zipCode = request.form.get('zip')
    village = request.form.get('village')
    cellPhone = request.form.get('cellPhone')
    homePhone = request.form.get('homePhone')
    eMail = request.form.get('eMail')
    dateJoined = request.form.get('dateJoined')
    typeOfWork = request.form.get('typeOfWork')

    newVolunteer = Member(
        Member_ID = villageID,
        Temporary_ID_Expiration_Date = expireDate,
        Temporary_Village_ID = hasTempID,
        First_Name = firstName,
        Middle_Name = middleName,
        Last_Name = lastName,
        Nickname = nickname,
        Address = street,
        City = city,
        State = state,
        Zip = zipCode,
        Village = village,
        Cell_Phone = cellPhone,
        Home_Phone = homePhone,
        eMail = eMail,
        Date_Joined = dateJoined,
        Default_Type_Of_Work = typeOfWork,
        NonMember_Volunteer = 1,
        Villages_Waiver_Signed = 1,
        Villages_Waiver_Date_Signed = todays_date
    ) 

    # GET UTC TIME
    est = timezone('America/New_York')
    
    # ADD TO tblMember_Data TABLE
    try:
        db.session.add(newVolunteer)
        db.session.commit()
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        flash('ERROR - '+error,'danger')
        db.session.rollback()
        return redirect(url_for('index',todaysDate=todaySTR)) 

    # ADD TO MEMBER TRANSACTION TABLE
    newTransaction = MemberTransactions(
        Transaction_Date = datetime.now(est),
        Member_ID = villageID,
        Staff_ID = staffID,
        Original_Data = '',
        Current_Data = villageID,
        Data_Item = 'NEW VOLUNTEER',
        Action = 'NEW'
    )
    # WRITE TO MEMBER_TRANSACTION TABLE
    try:
        db.session.add(newTransaction)
        db.session.commit() 
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        flash('ERROR - '+error,'danger')
        db.session.rollback()

    # DISPLAY NEW MEMBER RECORD SO STAFF CAN ENTER REMAINING DATA
    return redirect(url_for('index',villageID=villageID,todaysDate=todaySTR))
    



def getStaffID():
    if 'staffID' in session:
        staffID = session['staffID']
    else:
        #flash('Login ID is missing, will use 604875','danger')
        session['staffID'] = '604875'
        staffID = '604875'
    return staffID

def getShopID():
    if 'shopID' in session:
        shopID = session['shopID']
    else:
        # SET RA FOR TESTING; SEND FLASH ERROR MESSAGE FOR PRODUCTION
        session['shopID'] = 'RA'
        shopID = 'RA'
        msg = "Missing location information; Rolling Acres assumed."
        #flash(msg,"danger")
    return shopID    

def getStaffName():
    if 'staffname' in session:
        staffName = session['staffname']
    else:
        session['staffName'] = 'rlh'
        staffName = 'No name.'
    return staffName

@app.route("/savePhoto", methods=['GET','POST'])
def savePhoto():
    print('/savePhoto rtn ...')
    memberID = request.form['memberID']
    img = request.form['dataURL']
    print('img-',img)
    print('after img = ')
    # DOES IMAGE EXIST?
    photo = db.session.query(MemberPhoto).filter(MemberPhoto.memberID == memberID).first()
    if photo:
        # REPLACE CURRENT PHOTO
        photo.memberPhoto = img
        photo.commit
    else:
        try:
            insertSQL = "INSERT INTO tblMember_Photos (Member_ID, Member_Photo) "
            insertSQL += "VALUES ('" + memberID + "', '" + img + "'"
            db.session.execute(insertSQL)
            msg="SUCCESS"
        except:
            msg="Error saving photo."
    return jsonify(msg=msg)

    #return redirect(url_for('index') )   
    
@app.route("/checkVillageID")
def checkVillageID():
    memberID=request.args.get('memberID')   
    member = db.session.query(Member).filter(Member.Member_ID == memberID).first()
    if (member == None):
        msg = "NOT FOUND"
    else:
        msg = "Village ID " + memberID + " belongs to " + member.First_Name + ' ' + member.Last_Name
    return jsonify(msg=msg)

@app.route("/changeScheduleYear")
def changeScheduleYear(year):
    return redirect(url_for('index',villageID=memberID,scheduleYear=year))

@app.route("/savePhotoPOST", methods=['POST'])
def savePhotoPOST():
    memberID = request.form['memberID']
    currentWorkingDirectory = os.getcwd()
    memberPhotosPath = currentWorkingDirectory + "/app/static/memberPhotos/"
    fileName = memberID + ".jpg"
    filePath = memberPhotosPath + fileName

    # GET BASE64 DATA
    imgBase64 = request.form['imgBase64']

    # SPLIT OFF HEADER
    img_data = imgBase64.split(",",1)[1]
    
    # PARSE OUT DATA FROM BASE64 'img' VARIABLE
    img_data += '=='
    image = Image.open(BytesIO(b64decode(img_data)))

    # SAVE THE PARSED DATA TO A FILE - /status/memberPhotos/xxxxxx.png
    try:
        image.save(filePath)
        msg = "SUCCESS"
        return make_response (f"{msg}")
    except SQLAlchemyError as e:
        error = str(e.__dict__['orig'])
        msg = "ERROR - " + error
        return make_response (f"{msg}")
    except:
        msg = "ERROR"
        return make_response (f"{msg}")
    

    #  SAVE TO DATABASE
    # DOES IMAGE EXIST?
    # photo = db.session.query(MemberPhotos).filter(MemberPhotos.memberID == memberID).first()
    # if photo:
    #     # REPLACE CURRENT PHOTO
    #     photo.memberPhoto = image
    #     photo.commit
    # else:
    #     try:
    #         insertSQL = "INSERT INTO tblMember_Photos (Member_ID, Member_Photo) "
    #         insertSQL += "VALUES ('" + memberID + "', '" + img + "'"
    #         db.session.execute(insertSQL)
    #         msg="SUCCESS"
    #     except:
    #         msg="Error saving photo."
    # return jsonify(msg=msg)

    #return redirect(url_for('index') )   



    @app.route('/test')
    def test():
        #test error logging
        y = x / 0
        return 