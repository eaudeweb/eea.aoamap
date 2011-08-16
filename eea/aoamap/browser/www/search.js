jQuery(document).ready(function($) {

M.ellipsis = function(txt, n) {
  if(txt.length < n) {
    return txt;
  }
  else {
    return txt.substr(0, n) + "...";
  }
};

function setup_filter_form_visuals() {
  $('#description').val($('#description').attr('placeholder')).css(
    {'color': '#999999', 'font-style': 'italic'});
  $('#year').val($('#year').attr('placeholder')).css(
    {'color': '#999999', 'font-style': 'italic'});

  $('input.input-text').each(function(){
      $(this).focus(function(){
        if( $(this).val() == $(this).attr('placeholder') ){
          $(this).val('').css({'color': '#000000', 'font-style': 'normal'});
        }
      });

      $(this).blur(function(){
        if( $(this).val() == '' ){
          $(this).val($(this).attr('placeholder')).css(
            {'color': '#999999', 'font-style': 'italic'});
        }
      });
  });

  $('.toggle-icon').live('click', function(){
    if( $(this).hasClass('expanded') &&
        ($('.template-subsection', $(this).parent()).is(':visible') == true)){
      $('.template-subsection', $(this).parent()).slideUp();
      $(this).removeClass('expanded').addClass('collapsed');
    }

    if( $(this).hasClass('collapsed') &&
        ($('.template-subsection', $(this).parent()).is(':visible') == false)){
      $('.template-subsection', $(this).parent()).slideDown();
      $(this).removeClass('collapsed').addClass('expanded');
    }
  });
}

setup_filter_form_visuals();


$('#filters-form').submit(function(evt) {
  evt.preventDefault();
  request_search();
});

$('div#filters').bind('map-selection-changed', function(evt) {
  request_search();
});

$('#filters-form').change(function(evt) {
  request_search();
});

$('#filters-form #reset-button').click(function() {
  M.deselect_all_polygons();
});

function get_search_form_data() {
  var form_data = {};
  $.each($('#filters-form').serializeArray(), function(n, field) {
    if(field.value)
      form_data[field.name] = field.value;
  });

  form_data['country'] = M.get_selected_countries();

  if(form_data['text'] == $('#description').attr('placeholder')) {
    form_data['text'] = "";
  }

  if(form_data['year'] == $('#year').attr('placeholder')) {
    form_data['year'] = "";
  }
  return form_data;
}

M.search_busy = false;
M.delayed_search_timeout = null;
M.next_form_data = null;
M.search_cache = new Cache(50);
M.animation_speed = 300;

function request_search() {
  M.next_form_data = get_search_form_data();
  clearTimeout(M.delayed_search_timeout);
  M.delayed_search_timeout = setTimeout(search_now, 300);
}

function search_completed() {
  M.search_busy = false;
  search_now();
}

function search_now() {
  if(M.search_busy) {
    return;
  }
  if(M.next_form_data == null) {
    return;
  }
  var form_data = M.next_form_data;
  M.next_form_data = null;
  M.search_busy = true;
  perform_search(form_data);
}

function perform_search(form_data) {
  $('ul.search-results').text('');
  $('.loading-animation').fadeIn();

  var form_data_json = JSON.stringify(form_data);

  var cached_result = M.search_cache.getItem(form_data_json);
  if(cached_result == null) {
    $.getJSON(M.config['search_url'], form_data, function(results) {
      var t = Math.round(results['query-time'] * 100) / 100;
      M.debug_log("search results: " + results['documents'].length +
                  " documents in " + t + " seconds");
      M.search_cache.setItem(form_data_json, results);
      show_search_result(results);
      search_completed();
    });
  }
  else {
    M.debug_log('result found in cache');
    show_search_result(cached_result);
    search_completed();
  }
}

function show_search_result(results) {
  $('.loading-animation').hide();
  update_document_list(results['documents']);
  //update_polygon_numbers(results['documents']);

  $('#results').css({backgroundColor: '#ddd'}).animate(
                    {backgroundColor: '#fff'}, 500);
}

function perform_demo_search(form_data) {
  if(form_data['country'].length == 0)
    form_data['country'] = "(all)";

  if(! form_data['text'])
    form_data['text'] = "(all)";

  if(! form_data['theme'])
    form_data['theme'] = "(all)";

  if(! form_data['author-organisation'])
    form_data['author-organisation'] = "(all)";

  var message = "Searching for documents: " + JSON.stringify(form_data);
  $("div#filters-debug").html(message, "<br>");

  $.getJSON('data/test-documents.json').success(update_document_list);
}

var template = {
  'search-results': M.get_template($('ul.search-results')),
  'document-info': M.get_template($('div#document-info'))
};

function collapse_document_info() {
  var document_info = $('ul.search-results div.document-info');
  document_info.slideUp(M.animation_speed, function() { $(this).remove(); });
  return document_info;
}

$('div#filters').bind('map-coverage-hidden', collapse_document_info);

function update_document_list(documents) {
  var results = $('ul.search-results').empty();

  if(documents.length == 0) {
    var msg = "No results were found for this query";
    $('ul.search-results').append($('<li>').text(msg));

  }

  $.each(documents, function(n, doc) {
    var doc_li = template['search-results'].tmpl(doc);
    $('a.title', doc_li).click(function(evt) {
      evt.preventDefault();
      if($('div.document-info', doc_li).length > 0) {
        // click was on the current selection
        M.hide_country_coverage();
        return;
      }
      var collapsing_doc = collapse_document_info();
      var html = template['document-info'].tmpl(doc);
      var doc_info = $('<div class="document-info">').html(html);
      $(doc_li.append(doc_info));
      var list_offset = $('ul.search-results').offset()['top'];

      var offset = doc_li.offset()['top'];
      if(collapsing_doc.length > 0) {
        var collapsing_offset = collapsing_doc.offset()['top'];
        if(offset > collapsing_offset) {
          offset -= collapsing_doc.height();
        }
      }

      doc_info.hide().slideDown(M.animation_speed);
      $('#results').scrollTo(offset - list_offset, M.animation_speed);

      M.show_country_coverage(doc['country']);
    });
    results.append(doc_li);
  });
}

function update_polygon_numbers(documents) {
  var docs_and_countries = [];
  $.each(documents, function(n, doc) {
    docs_and_countries.push(doc['country']);
  });
  M.update_all_document_counts(docs_and_countries);
}

});
