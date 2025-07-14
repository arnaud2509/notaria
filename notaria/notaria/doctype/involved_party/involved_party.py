# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class InvolvedParty(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		main_contact_email: DF.Data | None
		main_contact_phone: DF.Data | None
		notes_on_party: DF.SmallText | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		party: DF.Link
		party_type: DF.Literal["Client Principal", "Partie Oppos\u00e9e", "B\u00e9n\u00e9ficiaire", "H\u00e9ritier / L\u00e9gataire", "T\u00e9moin", "Banque / Pr\u00eateur", "Avocat / Conseil", "Expert", "Autre"]
		specific_role: DF.Data | None
	# end: auto-generated types
	pass
