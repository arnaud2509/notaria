# Copyright (c) 2025, Arncla and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import requests

@frappe.whitelist()
def analyze_identity(docname):
    doc = frappe.get_doc("Identification Client", docname)
    file_url = doc.document_upload
    file_doc = frappe.get_doc("File", {"file_url": file_url})
    file_path = file_doc.get_full_path()

    with open(file_path, "rb") as f:
        files = {"file": f}
        headers = {"Authorization": "Bearer VOTRE_CLE_API_GRANITE"}
        response = requests.post("https://api.infomaniak.com/granite/ocr", headers=headers, files=files)

    data = response.json()
    
    # Exemple : à adapter selon le JSON retourné
    doc.first_name = data.get("first_name")
    doc.last_name = data.get("last_name")
    doc.id_number = data.get("id_number")
    doc.birth_date = data.get("birth_date")
    doc.save()
    
class Identitydocuments(Document):
	pass

