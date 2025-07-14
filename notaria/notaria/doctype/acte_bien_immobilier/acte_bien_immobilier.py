# Copyright (c) 2025, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class ActeBienImmobilier(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		cadastral_info_display: DF.Data | None
		linked_property: DF.Link | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data
		property_address_display: DF.Data | None
		role_in_acte: DF.Literal["Principal", "Accessoire", "D\u00e9pendance", "Autre"]
	# end: auto-generated types
	pass
