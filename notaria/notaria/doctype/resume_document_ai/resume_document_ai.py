# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class resume_document_ai(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		document_title: DF.Data
		file: DF.Attach
		full_text: DF.LongText | None
		resume: DF.TextEditor | None
		status: DF.Literal["Brouillon", "En traitement", "Fini"]
	# end: auto-generated types
	pass
