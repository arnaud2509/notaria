# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class type_acte(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from erpnext.notaria.doctype.type_acte_variable.type_acte_variable import TypeActeVariable
		from frappe.types import DF

		actif: DF.Check
		code_type_acte: DF.Data | None
		description: DF.SmallText | None
		nom: DF.Data | None
		select: DF.Literal["Immobilier", "Famille", "Succession", "Soci\u00e9t\u00e9", "Commercial", "Pouvoir / Procuration", "Contrat", "Fiscalit\u00e9", "Divers"]
		type_juridique: DF.Literal["Patrimonial", "Successoral", "Soci\u00e9t\u00e9", "Matrimonial", "Obligations", "Gouvernance"]
		variable: DF.Table[TypeActeVariable]
	# end: auto-generated types
	pass
