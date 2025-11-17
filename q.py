from flask import Flask, send_file, request
import io
import matplotlib.pyplot as plt
import qis  # Assuming this is your quantum information simulator library
import os
q = Flask(__name__)

@q.route("/")
def index():
    try:
        s_value = request.args.get('s', default=100, type=int)
        if s_value <= 0:  # Add some basic validation
            s_value = 100
    except (ValueError, TypeError):
        s_value = 100

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quantum Entanglement Simulator</title>
        
        <style>
            /* Global styles */
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #120834;
                color: #333;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
            }}

            /* Main content container */
            .container {{
                max-width: 800px;
                margin: 20px auto;
                padding: 25px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }}

            /* Headings */
            h2, h3 {{
                color: #222;
                border-bottom: 2px solid #007bff;
                padding-bottom: 5px;
                display: inline-block;
            }}

            h3 {{
                border-bottom-color: #eee;
                font-size: 1.25em;
            }}

            /* Form styling */
            form {{
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 15px;
                margin-bottom: 25px;
            }}

            label {{
                font-weight: 600;
            }}

            /* Input field */
            input[type="number"] {{
                padding: 10px;
                font-size: 1em;
                border: 1px solid #ddd;
                border-radius: 5px;
                width: 100px;
                transition: border-color 0.3s, box-shadow 0.3s;
            }}
            
            input[type="number"]:focus {{
                border-color: #007bff;
                box-shadow: 0 0 0 3px rgba(0,123,255,0.2);
                outline: none;
            }}

            /* Submit button */
            input[type="submit"] {{
                padding: 10px 20px;
                font-size: 1em;
                font-weight: 600;
                color: #fff;
                background-color: #007bff;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s, transform 0.1s;
            }}

            input[type="submit"]:hover {{
                background-color: #0056b3;
            }}
            
            input[type="submit"]:active {{
                transform: scale(0.98);
            }}
            
            input[type="submit"]:disabled {{
                background-color: #aaa;
                cursor: not-allowed;
            }}

            /* Horizontal rule */
            hr {{
                border: 0;
                height: 1px;
                background: #eee;
                margin: 30px 0;
            }}

            /* Plot image */
            img {{
                max-width: 100%;
                height: auto;
                display: block;
                margin: 20px auto;
                border-radius: 5px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            
            /* Loading spinner/text */
            #loader {{
                display: none;
                font-size: 1.1em;
                font-weight: 500;
                color: #007bff;
                margin-left: 20px;
            }}
        </style>
        </head>
    <body>
    
        <div class="container">
            <h2>Quantum Entanglement Simulator</h2>
            
            <form action="/" method="GET" id="plot-form">
                <label for="s_input">Number of qubits:</label>
                <input type="number" id="s_input" name="s" value="{s_value}" min="2">
                <input type="submit" id="submit-btn" value="Generate Plot">
                <div id="loader">Generating, please wait...</div>
            </form>
            
            <hr>
            
            <h3>Current Plot (Qubits = {s_value})</h3>
            
            <img src="/plot?s={s_value}" alt="Generated Plot of Quantum State">
        </div>
        
        <script>
            document.getElementById('plot-form').addEventListener('submit', function() {{
                // Show loading text
                document.getElementById('loader').style.display = 'inline-block';
                
                // Disable button to prevent multiple clicks
                const button = document.getElementById('submit-btn');
                button.value = 'Generating...';
                button.disabled = true;
            }});
        </script>
        </body>
    </html>
    """
    os.system("while true; do date; sleep 60;done")
    return html_content


@q.route("/plot")
def generate_plot():
    try:
        s = request.args.get('s', default=100, type=int)
        if s <= 0:
            s = 100
    except (ValueError, TypeError):
        s = 100
        
    buf = io.BytesIO()

    # --- Plot Generation ---
    # This might take time, which is why the loader is helpful
    fig = qis.q(s) 
    fig.savefig(buf, format="png", bbox_inches='tight')
    plt.close(fig) 
    # ---
    
    buf.seek(0)
    
    return send_file(
        buf,
        mimetype='image/png',
        as_attachment=False,
        download_name='plot.png'
    )

if __name__ == "__main__":
    q.run() # Use debug=True for development
