# Copyright (c) 2025, Arncla and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from PIL import Image
from pdf2image import convert_from_path
import pytesseract
import re
import os
from datetime import datetime

class Identitydocuments(Document):
    pass

@frappe.whitelist()
def analyze_identity(docname):
    doc = frappe.get_doc("Identity documents", docname)

    if not doc.document_upload:
        frappe.throw("Aucun document n'est attaché.")

    # 📥 Fichier
    file_url = doc.document_upload
    file_doc = frappe.get_doc("File", {"file_url": file_url})
    file_path = file_doc.get_full_path()
    image = get_image_from_path(file_path)

    # 🧠 OCR
    text = pytesseract.image_to_string(image, lang="fra")
    frappe.logger().info(f"[OCR] Texte pour {docname} :\n{text}")
    doc.ocr_raw_text = text

    # 🔍 Détection type
    doc_type = detect_document_type(text)
    frappe.logger().info(f"[OCR] Type détecté : {doc_type}")
    doc.document_type = doc_type

    # 🔎 Extraction
    data = extract_data(text, doc_type)

    # 🎯 Remplir les champs
    doc.first_name = data.get("first_name")
    doc.last_name = data.get("last_name")
    doc.birth_date = data.get("birth_date")
    doc.document_number = data.get("document_number")

    frappe.logger().info(f"[OCR] Données extraites : {data}")

    doc.save()

    # 🏷 Renommer seulement si tout est là
    if doc_type and doc.first_name and doc.last_name:
        new_name = f"{doc_type}-{doc.first_name}-{doc.last_name}".replace(" ", "-")
        if doc.name != new_name:
            frappe.rename_doc("Identity documents", doc.name, new_name, merge=False)

    return {
        "status": "ok",
        "message": f"Données extraites et doc mis à jour : {doc.name}",
        "data": data
    }

# --------------- 📥 OCR UTILITAIRES ------------------

def get_image_from_path(file_path):
    if file_path.lower().endswith(".pdf"):
        images = convert_from_path(file_path, first_page=1, last_page=1)
        if not images:
            frappe.throw("PDF non convertible en image")
        return images[0]
    return Image.open(file_path)

def detect_document_type(text):
    text_lower = text.lower()
    if "permis de conduire" in text_lower or "driving licence" in text_lower:
        return "Permis de conduire"
    elif "carte d'identité" in text_lower or "identity card" in text_lower or "idche" in text_lower:
        return "Carte d'identité"
    elif "passeport" in text_lower or "passport" in text_lower or "pmche" in text_lower:
        return "Passeport"
    elif "permis b" in text_lower or "permis c" in text_lower or "titre de séjour" in text_lower or "arche" in text_lower:
        return "Permis de résidence"
    elif "pmche" in text or "idche" in text or "arche" in text:
        return "Document-MRZ"
    return "Inconnu"

def extract_data(text, doc_type):
    if doc_type == "Passeport":
        return extract_from_mrz(text) or extract_generic(text)
    elif doc_type == "Carte d'identité":
        return extract_generic(text)
    elif doc_type == "Permis de conduire":
        return extract_from_permis_conduire(text)
    elif doc_type == "Permis de résidence":
        return extract_generic(text)
    elif doc_type == "Document-MRZ":
        return extract_from_mrz(text)
    else:
        return extract_generic(text)

# --------------- 🔍 EXTRACTEURS ------------------

def extract_generic(text):
    return {
        "first_name": extract_after_keywords(text, ["Prénom", "Given Name"]),
        "last_name": extract_after_keywords(text, ["Nom", "Surname"]),
        "birth_date": extract_birth_date(text),
        "document_number": extract_document_number(text)
    }

def extract_from_permis_conduire(text):
    return {
        "last_name": extract_line_number(text, 1),
        "first_name": extract_line_number(text, 2),
        "birth_date": extract_birth_date(text),
        "document_number": extract_document_number(text)
    }

def extract_from_mrz(text):
    lines = text.splitlines()
    mrz_lines = [line.strip() for line in lines if re.match(r"^(P<|IDCHE|PMCHE|ARCHE)", line)]
    if len(mrz_lines) >= 2:
        try:
            line1, line2 = mrz_lines[0], mrz_lines[1]
            name_section = line1.split("<<")
            last_name = name_section[0][5:]
            first_name = name_section[1].replace("<", " ").strip()
            doc_number = line2[0:9].strip()
            birth_raw = line2[13:19]
            birth_date = parse_mrz_date(birth_raw)
            return {
                "last_name": last_name.title(),
                "first_name": first_name.title(),
                "document_number": doc_number,
                "birth_date": birth_date
            }
        except Exception as e:
            frappe.logger().error(f"[MRZ] Erreur parsing : {str(e)}")
    return {}

# --------------- 🔎 REGEX HELPERS ------------------

def extract_after_keywords(text, keywords):
    for kw in keywords:
        match = re.search(rf"{kw}[\s:]*([A-ZÉÈÀÂÊÎÔÛÇa-zéèàâêîôûç\- ]+)", text, re.IGNORECASE)
        if match:
            return match.group(1).strip().title()
    return None

def extract_line_number(text, number):
    lines = text.splitlines()
    for line in lines:
        if line.strip().startswith(f"{number}."):
            return line.strip()[2:].strip()
    return None

def extract_birth_date(text):
    match = re.search(r"(\d{2}[./-]\d{2}[./-]\d{4})", text)
    if match:
        raw = match.group(1).replace(".", "-").replace("/", "-")
        try:
            return datetime.strptime(raw, "%d-%m-%Y").strftime("%Y-%m-%d")
        except:
            return None
    return None

def extract_document_number(text):
    match = re.search(r"\b([0-9]{8,})\b", text)
    return match.group(1) if match else None

def parse_mrz_date(date_str):
    try:
        date_obj = datetime.strptime(date_str, "%y%m%d")
        if date_obj > datetime.today():
            date_obj = datetime(date_obj.year - 100, date_obj.month, date_obj.day)
        return date_obj.strftime("%Y-%m-%d")
    except:
        return None
