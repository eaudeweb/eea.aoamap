AoA Map Viewer
==============

http://www.eea.europa.eu/themes/regions/pan-european/virtual-library

The AoA map viewer is a Plone application, that serves an interactive
map, based on data in the AoA Virtual Library. It queries the Virtual
Library, receives a JSON dump of the database, and displays a listing of
these documents, with search and filters, implemented in-browser with
JavaScript.

The map has several overlays, for countries, groups and regions. This
corresponds to the AoA representation of geographical coverage. The map
itself is tiled with several zoom levels, based on a high-resolution PDF
map. The tiles themselves are not part of this repository.


Workflow
--------
The app shows a list of reports below the map. Initially this list
contains all reports. They can be filtered  using the form on the right
side of the map (text search in title; filter by theme; filter by year)
and on the map (select one or more countries or regions). Country/region
selection is toggled from the "select on map" drop-down.

The results list can be ordered by upload year of publication or by
upload date in to the database. Clicking on a report expands the report
entry to show extra information and changes the map to display the
report's coverage.


Translation
-----------

To update the message catalog::

  cd eea/aoamap
  i18ndude rebuild-pot --pot locales/eea-aoamap.pot --create eea-aoamap ./browser

To create a new translation::

  msgen locales/eea-aoamap.pot > locales/ru/LC_MESSAGES/eea-aoamap.po

To update an existing translation::

  msgmerge locales/ru/LC_MESSAGES/eea-aoamap.po locales/eea-aoamap.pot > locales/ru/LC_MESSAGES/eea-aoamap.po.new
  mv locales/ru/LC_MESSAGES/eea-aoamap.po.new locales/ru/LC_MESSAGES/eea-aoamap.po

To compile a translation into an MO file::

  msgfmt -o locales/ru/LC_MESSAGES/eea-aoamap.mo locales/ru/LC_MESSAGES/eea-aoamap.po

Deployment
----------

A few things to remember when deploying the AoA map to production:

* Plone site - configure the map tile source
* Plone site - configure prefix of AoA portal
* AoA portal - configure and test cache invalidation URL(s)
* Plone site - Russian translation folder should be marked with is_empty=False
* Plone site - set `left_slots` to a false vale on each map parent folder
