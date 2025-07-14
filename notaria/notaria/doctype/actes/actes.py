# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Actes(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from erpnext.notaria.doctype.acte_bien_immobilier.acte_bien_immobilier import ActeBienImmobilier
		from erpnext.notaria.doctype.acte_document_requis.acte_document_requis import ActeDocumentRequis
		from frappe.types import DF

		acte_modeles: DF.Link | None
		acte_reference_number: DF.Data | None
		actual_signature_date: DF.Date | None
		actual_total_invoiced: DF.Currency
		affaire_notariale: DF.Link
		amended_from: DF.Link | None
		contenu_acte: DF.TextEditor
		creation_date: DF.Date | None
		estimated_disbursements: DF.Currency
		estimated_fees: DF.Currency
		expected_signature_date: DF.Date | None
		involved_properties: DF.Table[ActeBienImmobilier]
		linked_sales_invoice: DF.Link | None
		registration_date: DF.Date | None
		required_documents_checklist: DF.Table[ActeDocumentRequis]
		status_acte: DF.Literal["Brouillon", "En Attente de Pi\u00e8ces / Infos", "R\u00e9daction en Cours", "En R\u00e9vision Interne", "Pr\u00eat \u00e0 l'Envoi Client", "Envoy\u00e9 au Client", "En Attente de Signature", "Sign\u00e9", "En Cours d'Enregistrement", "Enregistr\u00e9 / Finalis\u00e9", "Archiv\u00e9", "Annul\u00e9"]
		title: DF.Data
		type_acte: DF.Link
	# end: auto-generated types
	pass
