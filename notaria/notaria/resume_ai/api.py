import frappe
import requests
from PyPDF2 import PdfReader
import os

@frappe.whitelist()
def extraire_texte_pdf(docname):
    doc = frappe.get_doc("resume_document_ai", docname)

    if not doc.file:
        frappe.throw("Aucun fichier n'est attaché.")

    file_doc = frappe.get_doc("File", {"file_url": doc.file})
    if file_doc.is_private:
        file_path = os.path.join(frappe.get_site_path("private", "files"), os.path.basename(file_doc.file_url))
    else:
        file_path = os.path.join(frappe.get_site_path("public", "files"), os.path.basename(file_doc.file_url))

    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
    except Exception as e:
        frappe.throw(f"Erreur lors de la lecture du PDF : {str(e)}")

    doc.full_text = text
    doc.status = "Texte extrait"
    doc.save()
    return text

@frappe.whitelist()
def generer_resume_infomaniak(docname):
    doc = frappe.get_doc("resume_document_ai", docname)
    text = doc.full_text or ""
    if not text:
        frappe.throw("Le texte à résumer est vide.")

    api_key = frappe.conf.get("infomaniak_api_key")
    product_id = frappe.conf.get("infomaniak_product_id")
    base = frappe.conf.get("infomaniak_base_url", "https://api.infomaniak.com")

    if not api_key or not product_id:
        frappe.throw("Veuillez configurer infomaniak_api_key et infomaniak_product_id dans site_config.json")

    url = f"{base}/1/ai/{product_id}/openai/chat/completions"

    payload = {
        "model": "granite",
        "messages": [
            {"role": "system", "content": "Vous êtes un assistant de résumé."},
            {"role": "user", "content": f"Résume en français ce texte :\n\n{text[:4000]}"}
        ],
        "max_tokens": 512,
        "stream": False,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    resp = requests.post(url, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    res = resp.json()

    # Extraire le résumé
    msg = res["choices"][0]["message"]["content"].strip()
    doc.resume = msg
    doc.status = "Fini"
    doc.save()
    return msg

@frappe.whitelist()
def extraire_et_resumer(docname):
    extraire_texte_pdf(docname)
    return generer_resume_infomaniak(docname)

