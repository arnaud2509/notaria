# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ActeDocumentRequis(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		attached_acte_files: DF.Attach | None
		document_name: DF.Data
		is_attached: DF.Check
		notes: DF.SmallText | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		status: DF.Literal["Manquant", "Re\u00e7u", "V\u00e9rifi\u00e9", "Non Applicable"]
	# end: auto-generated types
	pass
