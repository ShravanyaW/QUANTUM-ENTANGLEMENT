from flask import Flask, send_file, request
import io
import matplotlib.pyplot as plt
import qis


q = Flask(__name__)

@q.route("/")
def index():
    try:
        s_value = request.args.get('s', default=100, type=int)
    except (ValueError, TypeError):
        s_value = 100

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Quantum Entanglement Simulator</title>
    </head>
    <body>
        <h2>Enter the number of qubits</h2>
        
        <form action="/" method="GET">
            <label for="s_input">Number of qubits:</label>
            <input type="number" id="s_input" name="s" value="{s_value}">
            <input type="submit" value="Generate Plot">
        </form>
        
        <hr>
        
        <h3>Current Plot (Number of qubits={s_value}):</h3>
        
        <img src="/plot?s={s_value}" alt="Generated Plot">
        
    </body>
    </html>
    """
    
    return html_content


@q.route("/plot")
def generate_plot():
    try:
        s = request.args.get('s', default=100, type=int)
    except (ValueError, TypeError):
        s = 100
        
    buf = io.BytesIO()

    text = qis.q(s) 
    text.savefig(buf, format="png")
    plt.close(text) 

    buf.seek(0)
    
    return send_file(
        buf,
        mimetype='image/png',
        as_attachment=False,
        download_name='plot.png'
    )

if __name__ == "__main__":
    q.run()