"""
Siddhan Logs DB Admin - Lightweight SQLite CRUD web UI.
Provides table browsing, row viewing, editing, and raw SQL execution.
"""

import os
import sqlite3
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_prefix=1)
DB_PATH = os.environ.get("DATABASE_PATH", "/app/data/siddhan_logs.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/")
def index():
    """List all tables."""
    db = get_db()
    tables = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    db.close()
    return render_template("index.html", tables=[t["name"] for t in tables])


@app.route("/table/<table_name>")
def view_table(table_name):
    """View rows in a table with pagination."""
    db = get_db()
    # Validate table name exists
    exists = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,),
    ).fetchone()
    if not exists:
        db.close()
        return "Table not found", 404

    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("page_size", 50))
    offset = (page - 1) * page_size

    total = db.execute(f'SELECT COUNT(*) as c FROM "{table_name}"').fetchone()["c"]
    rows = db.execute(
        f'SELECT * FROM "{table_name}" LIMIT ? OFFSET ?', (page_size, offset)
    ).fetchall()
    columns = [desc[0] for desc in db.execute(f'SELECT * FROM "{table_name}" LIMIT 1').description] if rows else []

    # Get column info
    col_info = db.execute(f'PRAGMA table_info("{table_name}")').fetchall()

    db.close()
    return render_template(
        "table.html",
        table_name=table_name,
        columns=columns,
        col_info=col_info,
        rows=rows,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=(total + page_size - 1) // page_size,
    )


@app.route("/table/<table_name>/row/<row_id>")
def view_row(table_name, row_id):
    """View a single row by its id."""
    db = get_db()
    row = db.execute(f'SELECT * FROM "{table_name}" WHERE id = ?', (row_id,)).fetchone()
    columns = [desc[0] for desc in db.execute(f'SELECT * FROM "{table_name}" LIMIT 1').description] if row else []
    db.close()
    if not row:
        return "Row not found", 404
    return render_template("row.html", table_name=table_name, columns=columns, row=row)


@app.route("/table/<table_name>/edit/<row_id>", methods=["GET", "POST"])
def edit_row(table_name, row_id):
    """Edit a row."""
    db = get_db()
    if request.method == "POST":
        data = request.form.to_dict()
        data.pop("_row_id", None)
        sets = ", ".join([f'"{k}" = ?' for k in data.keys()])
        values = list(data.values()) + [row_id]
        db.execute(f'UPDATE "{table_name}" SET {sets} WHERE id = ?', values)
        db.commit()
        db.close()
        return redirect(url_for("view_table", table_name=table_name))

    row = db.execute(f'SELECT * FROM "{table_name}" WHERE id = ?', (row_id,)).fetchone()
    columns = [desc[0] for desc in db.execute(f'SELECT * FROM "{table_name}" LIMIT 1').description]
    col_info = db.execute(f'PRAGMA table_info("{table_name}")').fetchall()
    db.close()
    if not row:
        return "Row not found", 404
    return render_template("edit.html", table_name=table_name, columns=columns, col_info=col_info, row=row)


@app.route("/table/<table_name>/delete/<row_id>", methods=["POST"])
def delete_row(table_name, row_id):
    """Delete a row."""
    db = get_db()
    db.execute(f'DELETE FROM "{table_name}" WHERE id = ?', (row_id,))
    db.commit()
    db.close()
    return redirect(url_for("view_table", table_name=table_name))


@app.route("/sql", methods=["GET", "POST"])
def sql_console():
    """Execute raw SQL queries."""
    result = None
    columns = []
    error = None
    query = ""

    if request.method == "POST":
        query = request.form.get("query", "").strip()
        if query:
            db = get_db()
            try:
                cursor = db.execute(query)
                if query.upper().startswith("SELECT") or query.upper().startswith("PRAGMA"):
                    rows = cursor.fetchall()
                    columns = [desc[0] for desc in cursor.description] if cursor.description else []
                    result = rows
                else:
                    db.commit()
                    result = f"Query executed. Rows affected: {cursor.rowcount}"
            except Exception as e:
                error = str(e)
            finally:
                db.close()

    return render_template("sql.html", query=query, result=result, columns=columns, error=error)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
