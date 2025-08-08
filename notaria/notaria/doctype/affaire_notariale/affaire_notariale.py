# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Affairenotariale(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from notaria.notaria.doctype.involved_party.involved_party import InvolvedParty
		from frappe.types import DF

		actes: DF.Link | None
		amended_from: DF.Link | None
		assistant_responsable: DF.Link | None
		attached_general_files: DF.Attach | None
		client_principal: DF.Link | None
		closing_date: DF.Date | None
		involved_parties: DF.Table[InvolvedParty]
		notaire_responsable: DF.Link
		opening_date: DF.Date | None
		reference_number: DF.Data | None
		status: DF.Literal["Ouvert", "En Cours", "En Suspens", "Termin\u00e9", "Archiv\u00e9", "Annul\u00e9"]
		title: DF.Data
	# end: auto-generated types
	pass

@frappe.whitelist()
def get_document_requis_for_type(type_acte):
    type_doc = frappe.get_doc("Type Acte", type_acte)
    document = []
    for d in type_doc.document_requis:
        document.append({
            "document_name": d.document_name,
            "status": "Manquant",
            "notes": d.notes or ""
        })
    return document

