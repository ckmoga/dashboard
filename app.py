from flask import Flask, render_template, request
from markupsafe import escape

from db import get_db_connection

app = Flask(__name__)

@app.route('/')
def dashboard():
    project = request.args.get("project")
    date = request.args.get("date")
    conn = get_db_connection()
    posts = conn.execute('SELECT * FROM posts').fetchall()
    conn.close()
    return render_template('index.html', posts=posts)