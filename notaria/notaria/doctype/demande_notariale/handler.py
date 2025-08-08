import frappe

def creer_donnees(doc, method):
    # Vérifier si un contact avec ce courriel existe déjà
    if frappe.db.exists("Contact", {"email_id": doc.email}):
        frappe.msgprint(f"Un contact avec l'email {doc.email} existe déjà. Aucun nouveau contact n'a été créé.")
    else:
        # Créer un nouveau Contact
        contact = frappe.get_doc({
            "doctype": "Contact",
            "last_name": doc.last_name,
            "first_name": doc.first_name,
            "email_ids": [{
            "email_id": doc.email,
            "is_primary": 1
        }],
        "phone_nos": [{
            "phone": doc.phone,
            "is_primary_mobile_no": 1
        }]
            
        })
        contact.insert(ignore_permissions=True)
        frappe.msgprint(f"Contact {contact.name} créé avec succès.")