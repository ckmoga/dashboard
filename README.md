python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
pip install flask

export FLASK_APP=app
export FLASK_ENV=development
flask run