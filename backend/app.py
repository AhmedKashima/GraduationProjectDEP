import os

from base import api, socketio

app = api


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "Graduation backend is running"
    }, 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=False,
        allow_unsafe_werkzeug=True
    )