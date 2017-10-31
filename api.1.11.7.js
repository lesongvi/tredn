(function ($) {
    /**
     * Base widget for accessing Q4 private API data.
     * @class q4.api
     * @version 1.11.7
     * @abstract
     * @requires [Mustache.js](lib/mustache.min.js)
     * @requires [Moment.js_(optional)](lib/moment.min.js)
     * @example
     * This example uses an overall template.
     *
     * - It uses multiple date formats, and the Moment.js library instead of Datepicker.
     * - Since it is a Past Events widget, `showFuture` is set to `false`.
     *   However, `showAllYears` is `true` so that users can choose to see all past events at once.
     * - It also uses the `sortAscending` option.
     * ---
     * <div id='events'></div>
     *
     * <script>
     * $('#events').events({
     *     dateFormat: {
     *         date: 'MMMM Do, YYYY',
     *         time: 'h:mm:ss A'
     *     },
     *     useMoment: true,
     *     showAllYears: true,
     *     showFuture: false,
     *     sortAscending: true,
     *     yearTrigger: '.years li',
     *     template: (
     *         '<h1>Past Events</h1>' +
     *         '<ul class="years">{{#years}}<li>{{year}}</li>{{/years}}</ul>' +
     *         '<ul class="items">' +
     *             '{{#items}}' +
     *             '<li>' +
     *                 '<a href="{{url}}">{{title}}</a>' +
     *                 '<span class="date">{{date.date}}</span>' +
     *                 '<span class="time">{{date.time}}</span>' +
     *                 '<ul class="docs">' +
     *                 '{{#docs}}' +
     *                     '<a href="{{url}}">{{title}}</a>' +
     *                 '{{/docs}}' +
     *                 '</ul>' +
     *             '</li>' +
     *             '{{/items}}' +
     *         '</ul>'
     *     )
     * });
     * </script>
     * @example
     * This example uses the year and item templates instead of the main template.
     *
     * - It uses `minYear` to show only the past 5 years of financial reports.
     * - It uses a selectbox instead of triggers for the year navigation.
     * - It also displays annual reports' short type as `"FY"` instead of `"Annual"`.
     * ---
     * <div id='financials'>
     *     <h1>Financial Reports</h1>
     *     <select class="years"></select>
     *     <ul class="items"></select>
     * </div>
     *
     * <script>
     * $('#financials').financials({
     *     minYear: (new Date()).getFullYear() - 4,
     *     dateFormat: 'M d, yy',
     *     shortTypes: {
     *         'Annual Report': 'FY'
     *     },
     *     yearSelect: '.years',
     *     yearContainer: '.years',
     *     yearTemplate: '<option value="{{value}}">{{year}}</option>' +
     *     itemContainer: '.items',
     *     itemLoadingMessage: '<p class="loading">Loading financial reports for the selected year...</p>',
     *     itemTemplate: (
     *         '<li>' +
     *             '<h2>{{shortType}} {{year}}</h2>' +
     *             '<ul class="docs">' +
     *             '{{#docs}}' +
     *                 '<li><a href="{{docUrl}}" class="{{docType}}">{{docTitle}}</a></li>' +
     *             '{{/docs}}' +
     *             '</ul>' +
     *         '</li>'
     *     )
     * });
     * </script>
     */
    $.widget('q4.api', /** @lends q4.api */ {
        options: {
            /**
             * The base URL to use for API calls.
             * By default, calls go to the current domain, so this option is usually unnecessary.
             * @type {string}
             */
            url: '',
            /**
             * Use Public API
             * @default
             */
            usePublic: false,
            /**
             * Api Key for use with the public api
             * @default
             */
            apiKey: '',
            /**
             * The maximum number of results to fetch from the server.
             * @type {number}
             * @default
             */
            limit: 0,
            /**
             * The number of results to skip. Used for pagination.
             * @type {number}
             * @default
             */
            skip: 0,
            /**
             * If set to false the 'Exclude from latest' option will be ignored
             * @type {boolean}
             * @default
             */
            excludeSelection: true,
            /**
             * Whether the template should include items from all years,
             * regardless of the current year.
             * @type {boolean}
             * @default
             */
            fetchAllYears: false,
            /**
             * Whether to include an "all years" option in template data and year selectors.
             * If true, then "all years" will be the default year on first load;
             * otherwise the most recent year will be the default.
             * @type {boolean}
             * @default
             */
            showAllYears: false,
            /**
             * The text to use for the "all years" option.
             * @type {string}
             * @default
             */
            allYearsText: 'All',
            /**
             * The year to display when the widget first loads.
             * Default is to display items from all years if that option is enabled,
             * otherwise the most recent year.
             * A useful value you might want to pass is `(new Date()).getFullYear()`,
             * which will display items from the current calendar year.
             * @type {?number}
             */
            startYear: null,
            /**
             * Whether to start with `startYear` even if there are no documents for that year.
             * @type {boolean}
             * @default
             */
            forceStartYear: false,
            /**
             * Whether to fetch items dated in the future.
             * @type {boolean}
             * @default
             */
            showFuture: true,
            /**
             * Whether to fetch items dated in the past.
             * @type {boolean}
             * @default
             */
            showPast: true,
            /**
             * A list of tags to filter by.
             * @type {Array<string>}
             */
            tags: [],
            /**
             * The maximum length of an item's title. Zero for no limit.
             * @type {number}
             * @default
             */
            titleLength: 0,
            /**
             * The maximum length for the body, or zero for unlimited.
             * @type {number}
             * @default
             */
            bodyLength: 0,
            /**
             * The maximum length for the short body, or zero for unlimited.
             * @type {number}
             * @default
             */
            shortBodyLength: 0,
            /**
             * A map of short names for each financial report subtype, for use in templates
             * for financial reports and events.
             * @type {Object}
             */
            shortTypes: {
                'Annual Report': 'Annual',
                'Supplemental Report': 'Supplemental',
                'First Quarter': 'Q1',
                'Second Quarter': 'Q2',
                'Third Quarter': 'Q3',
                'Fourth Quarter': 'Q4'
            },
            /**
             * A date format string, which can be used in the template as `{{date}}`.
             * Can alternately be an object of format strings,
             * which can be accessed with `{{date.key}}` (where key is the
             * object key corresponding to the string you want to use).
             * By default, dates are formatted using jQuery UI's datepicker.
             * @example 'MM d, yy'
             * @example
             * {
             *     full: 'MM d, yy',
             *     short: 'mm/dd/y',
             *     month: 'MM',
             *     day: 'd'
             * }
             * @type {string|Object}
             * @default
             */
            dateFormat: 'mm/dd/yy',
            /**
             * Whether to use Moment.js to format dates instead of datepicker.
             * Only takes effect if the Moment.js library has been included.
             * @type {boolean}
             * @default
             */
            useMoment: false,
            /**
             * Whether to sort items in ascending chronological order.
             * @type {boolean}
             * @default
             */
            sortAscending: false,
            /**
             * An array of years to filter by. If passed, no items will
             * be displayed unless they are dated to a year in this list.
             * @type {Array<number>}
             */
            years: [],
            /**
             * The earliest year to display items from.
             * @type {?number}
             */
            minYear: null,
            /**
             * The latest year to display items from.
             * @type {?number}
             */
            maxYear: null,
            /**
             * The earliest date to display items from.
             * @type {?Date}
             */
            minDate: null,
            /**
             * The latest date to display items from.
             * @type {?Date}
             */
            maxDate: null,
            /**
             * A URL to a default thumbnail, in case an item has none.
             * @type {string}
             */
            defaultThumb: '',
            /**
             * A Mustache.js template for the overall widget.
             * This option is not required; you can also use `yearTemplate` and/or `itemTemplate`
             * to build the widget on top of existing layout.
             *
             * The following tags are available:
             *
             * - `{{#years}}` An array of years for the navigation. Each year has these subtags:
             *
             *   - `{{year}}`   The display label of the year (e.g. `"2015"`, `"All Years"`)
             *   - `{{value}}`  The internal value of the year (e.g. `2015`, `-1`)
             *   - `{{#items}}` An array of items for this year, with the same format as the
             *       "all items" array.
             * - `{{#yearsWithItems}}` Like `{{years}}` but with only years that have items.
             * - `{{#items}}` An array of all items. Each item has a number of available subtags,
             *   which vary depending which child widget you are using.
             *   For a list, check the documentation for the specific child widget:
             *
             *   - [q4.downloads](q4.downloads.html#option-template)
             *   - [q4.events](q4.events.html#option-template)
             *   - [q4.financials](q4.financials.html#option-template)
             *   - [q4.presentations](q4.presentations.html#option-template)
             *   - [q4.news](q4.news.html#option-template)
             *   - [q4.sec](q4.sec.html#option-template)
             *
             * @type {string}
             * @example
             * '<ul class="years">' +
             *     '{{#years}}<li>{{year}}</li>{{/years}}' +
             * '</ul>' +
             * '<h1>{{title}}</h1>' +
             * '<ul class="items">' +
             *     '{{#items}}<li><a target="_blank" href="{{url}}">{{title}}</a></li>{{/items}}' +
             *     '{{^items}}No items found.{{/items}}' +
             * '</ul>'
             */
            template: '',
            /**
             * Whether to append the main template to a `<div>` inside the widget container,
             * or replace the container's contents entirely.
             * @type {boolean}
             * @default
             */
            append: true,
            /**
             * An optional CSS class to apply to the widget container,
             * or if `append` is true, to the `<div>` containing the main template.
             * @type {?string}
             */
            cssClass: null,
            /**
             * A CSS class to add to the widget while data is loading.
             * This can be used to show and hide elements within the widget.
             * @type {?string}
             */
            loadingClass: null,
            /**
             * A message or HTML string to display while first loading the widget.
             * See also `itemLoadingMessage`.
             * @type {?string}
             * @default
             */
            loadingMessage: 'Loading...',
            /**
             * A selector for the year navigation container.
             * Use this if you don't want to use the `template` option to draw the widget,
             * but you still want to generate a list of years.
             * You must also pass `yearTemplate` for this to have any effect.
             * @type {?string}
             */
            yearContainer: null,
            /**
             * A Mustache.js template for a single year.
             * If this and `yearContainer` are passed, this will be used to render each option in
             * the year navigation, which will be attached to the widget at `yearContainer`.
             * See the `template` option for available tags.
             * @type {?string}
             * @example '<li>{{year}}</li>'
             * @example '<option value="{{value}}">{{year}}</option>'
             */
            yearTemplate: null,
            /**
             * A CSS selector for year trigger links.
             * If passed, any elements in the widget matching this selector will
             * become clickable links that filter the displayed items by year.
             * Usually you'll want to point this to an element in the template's `{{years}}` loop.
             *
             * Note that this doesn't automatically generate the year links;
             * you can do that in the template.
             * @example 'a.yearLink'
             * @type {?string}
             */
            yearTrigger: null,
            /**
             * A CSS selector for a year selectbox.
             * This behaves like the `yearTrigger` option, except instead of pointing to
             * individual links, it should point to a `<select>` or similar form element.
             *
             * Note that this doesn't automatically fill the box with `<option>`s;
             * you can do that in the template.
             * @example 'select.yearsDropdown'
             * @type {?string}
             */
            yearSelect: null,
            /**
             * A CSS selector for a tag selectbox or text input.
             * This should point to a `<select>`, `<input>` or similar form element.
             * When the element's value changes, the value will be used
             * as a space- or comma-separated list of tags to filter the items by.
             * @example 'select.tagDropdown'
             * @example 'input.tagList'
             * @type {?string}
             */
            tagSelect: null,
            /**
             * The CSS class to add to a selected year trigger.
             * @type {string}
             * @default
             */
            activeClass: 'active',
            /**
             * A selector for the items container.
             * Use this if you want to redraw only the item list at initialization
             * and when the year is updated, instead of redrawing the entire widget.
             * You must also pass `itemTemplate` for this to have any effect.
             * @type {?string}
             */
            itemContainer: null,
            /**
             * A Mustache.js template for a single item.
             * If this and `itemContainer` are passed, this will be used to render the items list,
             * and it will be attached to the widget at `itemContainer`.
             * When the year changes, only this part of the widget will be redrawn,
             * instead of the entire thing.
             * See the `template` option for available tags.
             * @type {string}
             * @example
             * '<li>' +
             *     '<img class="thumb" src="{{thumb}}">' +
             *     '<span class="date">{{date}}</span>' +
             *     '<a href="{{url}}" class="title">{{title}}</a>' +
             * '</li>'
             */
            itemTemplate: '',
            /**
             * A CSS class to add to the widget while loading items.
             * This can be used to show and hide elements within the item container.
             * You must also pass `itemContainer` and `itemTemplate` for this to have any effect.
             * By default it is the same as `itemLoadingMessage`.
             * @type {?string}
             */
            itemLoadingClass: null,
            /**
             * A message or HTML string to display while loading items.
             * You must also pass `itemContainer` and `itemTemplate` for this to have any effect.
             * By default it is the same as `loadingMessage`.
             * @type {?string}
             */
            itemLoadingMessage: null,
            /**
             * A message or HTML string to display in the items container if no items are found.
             * @type {string}
             * @default
             */
            itemNotFoundMessage: 'No items found.',
            /**
             * A callback that fires when the display year changes.
             * @type {function}
             * @param {Event}  [event] The triggering event object.
             * @param {Object} [data]  A data object with these properties:
             * - `year` The year to be displayed.
             */
            onYearChange: function (e, data) {},
            /**
             * A callback that fires when the list of tags to display changes.
             * @type {function}
             * @param {Event}  [event] The triggering event object.
             * @param {Object} [data]  A data object with these properties:
             * - `tags` The array of tags to filter by.
             */
            onTagChange: function (e, data) {},
            /**
             * A callback that fires before the full widget is rendered.
             * @type {function}
             * @param {Event}  [event]        The event object.
             * @param {Object} [templateData] The complete template data.
             */
            beforeRender: function (e, tplData) {},
            /**
             * A callback that fires before the items list is rendered.
             * This only fires if `itemContainer` and `itemTemplate` are set.
             * @type {function}
             * @param {Event}  [event]        The event object.
             * @param {Object} [templateData] Template data for the items list.
             */
            beforeRenderItems: function (e, tplData) {},
            /**
             * A callback that fires before the years are rendered.
             * @type {function}
             * @param {Event}  [event]        The event object.
             * @param {Object} [templateData] Template data for the years list.
             */
            beforeRenderYears: function (e, tplData) {},
            /**
             * A callback that fires after the item list is rendered.
             * This only fires if `itemContainer` and `itemTemplate` are set.
             * @type {function}
             * @param {Event} [event] The event object.
             */
            itemsComplete: function (e) {},
            /**
             * A callback that fires after the entire widget is rendered.
             * @type {function}
             * @param {Event} [event] The event object.
             */
            complete: function (e) {}
        },

        $widget: null,

        years: null,

        currentYear: -1,
        currentTags: [],

        _setOption: function (key, value) {
            this._super(key, value);
            this._normalizeOptions();
        },

        _convertToArray: function (value) {
            // treat a string like a space-, pipe- or comma-separated list
            if (typeof value == 'string') {
                value = $.trim(value).split(/[\s,|]+/);
            }
            return $.isArray(value) ? value : [];
        },

        _convertToDate: function (value) {
            var date = new Date(value);
            return (date.toString() == 'Invalid Date') ? null : date;
        },

        _normalizeOptions: function () {
            var o = this.options;

            // strip trailing slash from domain
            o.url = o.url.replace(/\/$/, '');

            // convert strings to arrays
            o.years = this._convertToArray(o.years).sort(function (a, b) { return b - a; });
            o.tags = this._convertToArray(o.tags);

            // convert strings to ints
            if (typeof o.startYear == 'string' && o.startYear.length) {
                o.startYear = parseInt(o.startYear);
            }

            // convert dates
            o.minDate = o.minDate ? this._convertToDate(o.minDate) : null;
            o.maxDate = o.maxDate ? this._convertToDate(o.maxDate) : null;

            // if item loading class/message is unset, set to match loading class/message
            if (o.itemLoadingClass === null) o.itemLoadingClass = o.loadingClass;
            if (o.itemLoadingMessage === null) o.itemLoadingMessage = o.loadingMessage;

            // GetEventYearList doesn't accept EventSelection for some reason
            // so we need this as a workaround
            var thisYear = new Date().getFullYear();
            if (o.showPast && !o.showFuture) {
                o.maxYear = Math.min(thisYear, o.maxYear || thisYear);
            }
            else if (o.showFuture && !o.showPast) {
                o.minYear = Math.max(thisYear, o.minYear || thisYear);
            }
        },

        _init: function () {
            var _ = this,
                o = this.options,
                $e = this.element;

            // save content type (and abort if there is none)
            if (this.widgetName == 'api') {
                throw new Error("Please use one of q4.api's child widgets.");
            }
            this.contentType = this.contentTypes[this.widgetName];

            this._normalizeOptions();

            // save a reference to the widget
            this.$widget = o.append ? $('<div>').appendTo($e) : $e;

            // add classes and append the loading message
            if (o.cssClass) this.$widget.addClass(o.cssClass);
            if (o.loadingClass) this.$widget.addClass(o.loadingClass);
            this.$widget.html(o.loadingMessage || '');

            // initialize tags
            this.currentTags = o.tags;

            // get years (and possibly items at the same time)
            this._getYears().done(function (years, items) {
                // filter years and get the active year
                _.years = _._filterYears(years);
                _.currentYear = _._getCurrentYear(_.years);

                // if we got items as side-effect of getting years, skip straight to rendering
                if (items !== undefined) {
                    _._renderWidget(items);
                }
                else {
                    _._fetchItems(_.currentYear).done(function (items) {
                        _._renderWidget(items);
                    });
                }
            });
        },

        _getYears: function () {
            var o = this.options;

            // if we're fetching all docs for all years, skip fetching the year list
            if (o.fetchAllYears && !o.limit) {
                var gotYears = $.Deferred();

                // get items for all years
                this._fetchItems(-1).done(function (items) {
                    // get list of years from items
                    var years = [];
                    $.each(items, function (i, item) {
                        if ($.inArray(item.year, years) == -1) years.push(item.year);
                    });

                    // return years and items
                    gotYears.resolve(years, items);
                });

                return gotYears;
            }
            else return this._fetchYears();
        },

        _filterYears: function (years) {
            var o = this.options;

            // filter years
            years = $.grep(years, function (year) {
                return (
                    (!o.minYear || year >= o.minYear) &&
                    (!o.maxYear || year <= o.maxYear) &&
                    (!o.years.length || $.inArray(year, o.years) > -1)
                );
            });

            // force startYear onto the years array if requested
            if (o.forceStartYear && $.inArray(o.startYear, years) == -1)
                years.push(o.startYear);

            // sort the years in descending order
            years.sort(function (a, b) { return b - a });

            return years;
        },

        _getCurrentYear: function (years) {
            var o = this.options;

            if (years.length) {
                // if o.startYear is specified and it exists, use it
                if ($.inArray(o.startYear, years) > -1) return o.startYear;
                // otherwise if "all" is not enabled, use the most recent
                if (!o.showAllYears) return years[0];
                // or if "all" is enabled, use all
            }
            return -1;
        },

        _buildParams: function () {
            var o = this.options,
                obj = o.usePublic ? {
                    apiKey: o.apiKey
                } : {
                    serviceDto: {
                        ViewType: GetViewType(),
                        ViewDate: GetViewDate(),
                        RevisionNumber: GetRevisionNumber(),
                        LanguageId: GetLanguageId(),
                        Signature: GetSignature()
                    }
                }

            return obj;
        },

        _callApi: function (url, params) {
            var o = this.options;

            if (o.usePublic) {
                return $.ajax({
                    type: 'GET',
                    url: o.url + url,
                    data: params,
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                });
            } else {
                return $.ajax({
                    type: 'POST',
                    url: url,
                    data: JSON.stringify(params),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                });
            }
        },

        _fetchYears: function () {
            var _ = this,
                o = this.options,
                source = !o.usePublic ? 0 : 1,
                gotYears = $.Deferred(),
                currentTags = $.grep(this.currentTags || [], function (tag) {
                    return tag.length > 0;
                });

            var obj = o.usePublic ? {
                tagList: currentTags.join('|')
            } : {
                serviceDto: {
                    TagList: currentTags
                }
            };

            this._callApi(this.contentType.yearsUrl[source], $.extend(true,
                this._buildParams(),
                this.contentType.buildParams.call(this, o), obj
            )).done(function (data) {
                _._trigger('beforeRenderYears', null, {items: data[_.contentType.yearsResultField]});
                gotYears.resolve(data[_.contentType.yearsResultField]);
            });

            return gotYears;
        },

        _fetchItems: function (year) {
            var _ = this,
                o = this.options,
                source = !o.usePublic ? 0 : 1,
                gotItems = $.Deferred(),
                currentTags = $.grep(this.currentTags, function (tag) {
                    return tag.length > 0;
                });

            var obj = o.usePublic ? {
                pageSize: o.limit || -1,
                tagList: currentTags.join('|'),
                includeTags: true,
                year: o.fetchAllYears ? -1 : year,
                excludeSelection: o.excludeSelection ? 0 : 1
            } : {
                serviceDto: {
                    ItemCount: o.limit || -1,
                    StartIndex: o.skip,
                    TagList: currentTags,
                    IncludeTags: true
                },
                excludeSelection: o.excludeSelection ? 0 : 1,
                year: o.fetchAllYears ? -1 : year
            };

            this._callApi(this.contentType.itemsUrl[source], $.extend(true,
                this._buildParams(),
                this.contentType.buildParams.call(this, o), obj
            )).done(function (data) {
                // parse, filter and sort items
                var items = $.map(data[_.contentType.itemsResultField], function (rawItem) {
                    return _.contentType.parseItem.call(_, o, rawItem);
                });
                items = $.grep(items, function (item) {
                    return (
                        (!o.minDate || item.dateObj >= o.minDate) &&
                        (!o.maxDate || item.dateObj <= o.maxDate)
                    );
                });
                items.sort(function (a, b) {
                    return (b.dateObj - a.dateObj) * (o.sortAscending ? -1 : 1);
                });
                gotItems.resolve(items);
            });

            return gotItems;
        },

        _truncate: function (text, length) {
            if (!text) return '';
            return !length || text.length <= length ? text : text.substring(0, length) + '...';
        },

        _formatDate: function (dateString) {
            var o = this.options,
                date = new Date(dateString),
                useMoment = o.useMoment && typeof moment != 'undefined';

            if (typeof o.dateFormat == 'string') {
                // if o.dateFormat is a format string, return a formatted date string
                return useMoment ? moment(date).format(o.dateFormat) :
                    $.datepicker.formatDate(o.dateFormat, date);
            }
            else if (typeof o.dateFormat == 'object') {
                // if o.dateFormat is an object of names to format strings,
                // return an object of names to formatted date strings
                var dates = {};
                for (name in o.dateFormat) {
                    dates[name] = useMoment ? moment(date).format(o.dateFormat[name]) :
                        $.datepicker.formatDate(o.dateFormat[name], date);
                }
                return dates;
            }
        },

        _buildTemplateData: function (items) {
            var _ = this,
                o = this.options,
                itemsByYear = {},
                tplData = {
                    items: [],
                    years: [],
                    yearsWithItems: []
                };

            $.each(items, function (i, item) {
                // only save items that are in the years array
                if ($.inArray(item.year, _.years) == -1) return true;
                if (!(item.year in itemsByYear)) itemsByYear[item.year] = [];

                // add item to template data
                tplData.items.push(item);
                itemsByYear[item.year].push(item);
            });

            // add "all years" option, if there are years to show
            if (o.showAllYears && this.years.length) {
                tplData.years.push({
                    year: o.allYearsText,
                    value: -1,
                    items: tplData.items
                });
            }
            // build per-year data for template
            $.each(this.years, function (i, year) {
                tplData.years.push({
                    year: year,
                    value: year,
                    items: itemsByYear[year] || []
                });
                if (year in itemsByYear) {
                    tplData.yearsWithItems.push({
                        year: year,
                        value: year,
                        items: itemsByYear[year]
                    });
                }
            });

            return tplData;
        },

        _renderItems: function (items) {
            var o = this.options,
                $e = this.element,
                $itemContainer = $(o.itemContainer, $e);

            this._trigger('beforeRenderItems', null, {items: items});

            // remove loading class
            if (o.itemLoadingClass) $itemContainer.removeClass(o.itemLoadingClass);

            // clear previous contents and render items, or 'not found' message
            if (items.length) {
                $itemContainer.empty();
                $.each(items, function (i, item) {
                    $itemContainer.append(Mustache.render(o.itemTemplate, item));
                });
            } else {
                $itemContainer.html(o.itemNotFoundMessage || '');
            }

            this._trigger('itemsComplete');
        },

        _renderWidget: function (items) {
            var _ = this,
                o = this.options,
                $e = this.element;

            // get template data
            var tplData = this._buildTemplateData(items);

            var yearItems = [];
            $.each(tplData.years, function (i, tplYear) {
                if (tplYear.value == _.currentYear) {
                    // set the active year in the template data
                    tplYear.active = true;
                    // save this year's items for separate item rendering
                    yearItems = tplYear.items;
                }
            });

            this._trigger('beforeRender', null, tplData);

            // remove loading class, clear previous contents and render entire widget
            if (o.loadingClass) this.$widget.removeClass(o.loadingClass);
            this.$widget.html(Mustache.render(o.template, tplData));

            // render items separately if applicable
            if (o.itemContainer && o.itemTemplate) {
                this._renderItems(yearItems);
            }

            // render years separately if applicable
            if (o.yearContainer && o.yearTemplate) {
                $(o.yearContainer, $e).empty();
                $.each(tplData.years, function (i, tplYear) {
                    $(o.yearContainer, $e).append(Mustache.render(o.yearTemplate, tplYear));
                });
            }
            // bind events to year triggers/selectbox
            if (o.yearTrigger) {
                // add year data to each trigger and bind click event
                $(o.yearTrigger, $e).each(function (i) {
                    var year = tplData.years[i].value;
                    $(this).data('year', year);

                    $(this).click(function (e) {
                        if (!$(this).hasClass(o.activeClass)) _.setYear(year, e);
                    });
                });
            }
            if (o.yearSelect) {
                // bind change event to selectbox
                $(o.yearSelect, $e).change(function (e) {
                    _.setYear($(this).val(), e);
                });
            }

            // bind events to tag selectbox/input
            if (o.tagSelect) {
                $(o.tagSelect, $e).change(function (e) {
                    _.setTags($(this).val(), e);
                });
            }

            if (o.customSelect) {

            }

            // set triggers/selectbox to show active year
            this._updateYearControls(this.currentYear);

            // fire callback
            this._trigger('complete');
        },

        _updateYearControls: function (year) {
            var o = this.options,
                $e = this.element;

            if (o.yearTrigger) {
                $(o.yearTrigger, $e).each(function () {
                    $(this).toggleClass(o.activeClass, $(this).data('year') == year);
                });
            }
            if (o.yearSelect) {
                $(o.yearSelect, $e).val(year);
            }
        },

        /**
         * Reload all items in the widget including the year list.
         */
        reloadYears: function() {
            var _ = this,
                o = this.options,
                $e = this.element;

            _._getYears().done(function (years, items) {
                var tplData = { years: [] };
                
                if (years.length) {
                    _.years = _._filterYears(years);

                    $.each(_.years, function(i, year){
                        tplData.years.push({
                            year: year,
                            value: year
                        });
                    });

                    _.currentYear = tplData.years[0].year;

                    $(o.yearContainer, $e).empty();
                    $.each(tplData.years, function (i, tplYear) {
                        $(o.yearContainer, $e).append(Mustache.render(o.yearTemplate, tplYear));
                    });

                    _.reloadItems();
                } else {
                    $(o.yearContainer, $e).empty();
                    $(o.itemContainer, $e).html(o.itemNotFoundMessage || '');
                }
            });
        },

        /**
         * Reload all items in the widget, maintaining the current year, tags and other options.
         * This is run automatically by `setYear`, `setTags` and `reloadYears`, and can be run manually
         * after using the `option` method to change other options, such as press release category.
         */
        reloadItems: function () {
            var _ = this,
                o = this.options,
                $e = this.element;

            // add loading class and display loading message
            if (o.itemContainer && o.itemTemplate) {
                var $itemContainer = $(o.itemContainer, $e);
                if (o.itemLoadingClass) $itemContainer.addClass(o.itemLoadingClass);
                $itemContainer.html(o.itemLoadingMessage || '');
            }
            else {
                if (o.loadingClass) this.$widget.addClass(o.loadingClass);
                this.$widget.html(o.loadingMessage || '');
            }

            // fetch and display items
            this._fetchItems(this.currentYear).done(function (items) {
                if (o.itemContainer && o.itemTemplate) {
                    // rerender item section
                    _._renderItems(items);
                }
                else {
                    // rerender entire widget
                    _._renderWidget(items);
                }
            });
        },

        setDateRange: function() {
            // start - end

        },

        /**
         * Display items from a particular year. This will refetch the list of items if necessary.
         * @param {number} year    The year to display, or -1 for all years.
         * @param {Event}  [event] The triggering event, if any.
         */
        setYear: function (year, e) {
            var o = this.options;

            // default value if year is invalid
            var currentYear = parseInt(year);
            if ($.inArray(currentYear, this.years) == -1) {
                currentYear = o.showAllYears ? -1 : this.years[0];
            }

            // fire callback, cancel event if default action is prevented
            this._trigger('onYearChange', e, {year: currentYear});
            if (e && e.isDefaultPrevented()) return;

            this.currentYear = currentYear;
            this._updateYearControls(this.currentYear);

            this.reloadItems();
        },

        /**
         * Display items with at least one of a particular set of tags.
         * This will refetch the list of items if necessary.
         * @param {Array<string>} tags    The array of tags to look for.
         * @param {Event}         [event] The triggering event, if any.
         */
        setTags: function (tags, e) {
            tags = this._convertToArray(tags);

            // fire callback, cancel event if default action is prevented
            this._trigger('onTagChange', e, {tags: tags});
            if (e && e.isDefaultPrevented()) return;

            this.currentTags = tags;

            this.reloadItems();
        },

        contentTypes: {
            downloads: {
                itemsUrl: ['/Services/ContentAssetService.svc/GetContentAssetList','/feed/ContentAsset.svc/GetContentAssetList'],
                yearsUrl: ['/Services/ContentAssetService.svc/GetContentAssetYearList','/feed/ContentAsset.svc/GetContentAssetYearList'],
                itemsResultField: 'GetContentAssetListResult',
                yearsResultField: 'GetContentAssetYearListResult',

                buildParams: function (o) {
                    return {
                        assetType: o.downloadType,
                    };
                },

                parseItem: function (o, result) {
                    return {
                        title: this._truncate(result.Title, o.titleLength),
                        url: result.FilePath,
                        dateObj: new Date(result.ContentAssetDate),
                        year: new Date(result.ContentAssetDate).getFullYear(),
                        date: this._formatDate(result.ContentAssetDate),
                        type: result.Type,
                        fileType: result.FileType,
                        size: result.FileSize,
                        icon: result.IconPath,
                        thumb: result.ThumbnailPath,
                        tags: result.TagsList,
                        description: this._truncate(result.Description, o.bodyLength)
                    };
                }
            },

            events: {
                itemsUrl: ['/Services/EventService.svc/GetEventList','/feed/Event.svc/GetEventList'],
                yearsUrl: ['/Services/EventService.svc/GetEventYearList','/feed/Event.svc/GetEventYearList'],
                itemsResultField: 'GetEventListResult',
                yearsResultField: 'GetEventYearListResult',

                buildParams: function (o) {
                    return {
                        eventSelection: o.showFuture && !o.showPast ? 1 : (o.showPast && !o.showFuture ? 0 : 3),
                        eventDateFilter: o.showFuture && !o.showPast ? 1 : (o.showPast && !o.showFuture ? 0 : 3),
                        includeFinancialReports: true,
                        includePresentations: true,
                        includePressReleases: true,
                        sortOperator: o.sortAscending ? 0 : 1
                    };
                },

                parseItem: function (o, result) {
                    var _ = this,
                        now = new Date(),
                        startDate = new Date(result.StartDate),
                        endDate = new Date(result.EndDate);

                    return {
                        title: this._truncate(result.Title, o.titleLength),
                        url: result.LinkToDetailPage,
                        id: result.EventId,
                        dateObj: startDate,
                        year: startDate.getFullYear(),
                        date: this._formatDate(result.StartDate),
                        endDate: this._formatDate(result.EndDate),
                        timeZone: result.TimeZone == "0" ? "" : result.TimeZone,
                        isFuture: startDate > now,
                        isPast: endDate < now,
                        location: result.Location,
                        tags: result.TagsList,
                        body: this._truncate(result.Body, o.bodyLength),
                        webcast: result.WebCastLink,
                        docs: $.map(result.Attachments, function (doc) {
                            return {
                                title: doc.Title,
                                url: doc.Url,
                                type: doc.Type,
                                extension: doc.Extension,
                                size: doc.Size
                            };
                        }),
                        speakers: $.map(result.EventSpeaker, function (speaker) {
                            return {
                                name: speaker.SpeakerName,
                                position: speaker.SpeakerPosition
                            };
                        }),
                        financialReports: $.map(result.EventFinancialReport, function (fr) {
                            return _.contentTypes.financials.parseItem.call(_, o, fr);
                        }),
                        pressReleases: $.map(result.EventPressRelease, function (pr) {
                            return _.contentTypes.news.parseItem.call(_, o, pr);
                        }),
                        presentations: $.map(result.EventPresentation, function (pres) {
                            return _.contentTypes.presentations.parseItem.call(_, o, pres);
                        })
                    };
                }
            },

            financials: {
                itemsUrl: ['/Services/FinancialReportService.svc/GetFinancialReportList','/feed/FinancialReport.svc/GetFinancialReportList'],
                yearsUrl: ['/Services/FinancialReportService.svc/GetFinancialReportYearList','/feed/FinancialReport.svc/GetFinancialReportYearList'],
                itemsResultField: 'GetFinancialReportListResult',
                yearsResultField: 'GetFinancialReportYearListResult',

                buildParams: function (o) {
                    // redundant options, because List and YearList have differently named params
                    return {
                        reportTypes: o.reportTypes.join('|'),
                        reportSubType: o.reportTypes, // for YearList
                        reportSubTypeList: o.reportTypes // for List
                    };
                },

                parseItem: function (o, result) {
                    var _ = this;

                    // parse docs
                    var docs = $.map(result.Documents, function (doc) {
                        return {
                            docCategory: doc.DocumentCategory,
                            docSize: doc.DocumentFileSize,
                            docIcon: doc.IconPath,
                            docThumb: doc.ThumbnailPath,
                            docTitle: _._truncate(doc.DocumentTitle, o.titleLength),
                            docType: doc.DocumentFileType,
                            docUrl: doc.DocumentPath
                        };
                    });
                    // filter docs by category if needed
                    if ($.isArray(o.docCategories) && o.docCategories.length) {
                        docs = $.grep(docs, function (doc) {
                            return $.inArray(doc.docCategory, o.docCategories) > -1;
                        });
                    }

                    return {
                        coverUrl: result.CoverImagePath,
                        title: result.ReportTitle,
                        fiscalYear: result.ReportYear,
                        dateObj: new Date(result.ReportDate),
                        year: new Date(result.ReportDate).getFullYear(),
                        date: this._formatDate(result.ReportDate),
                        tags: result.TagsList,
                        type: result.ReportSubType,
                        shortType: o.shortTypes[result.ReportSubType],
                        docs: docs
                    };
                }
            },

            presentations: {
                itemsUrl: ['/Services/PresentationService.svc/GetPresentationList','/feed/Presentation.svc/GetPresentationList'],
                yearsUrl: ['/Services/PresentationService.svc/GetPresentationYearList','/feed/Presentation.svc/GetPresentationYearList'],
                itemsResultField: 'GetPresentationListResult',
                yearsResultField: 'GetPresentationYearListResult',

                buildParams: function (o) {
                    return {
                        presentationSelection: o.showFuture && !o.showPast ? 0 : (o.showPast && !o.showFuture ? 1 : 3),
                    };
                },

                parseItem: function (o, result) {
                    return {
                        title: this._truncate(result.Title, o.titleLength),
                        url: result.LinkToDetailPage,
                        dateObj: new Date(result.PresentationDate),
                        year: new Date(result.PresentationDate).getFullYear(),
                        date: this._formatDate(result.PresentationDate),
                        tags: result.TagsList,
                        body: this._truncate(result.Body, o.bodyLength),
                        docUrl: result.DocumentPath,
                        docSize: result.DocumentFileSize,
                        docType: result.DocumentFileType,
                        thumb: result.ThumbnailPath
                    };
                }
            },

            news: {
                itemsUrl: ['/Services/PressReleaseService.svc/GetPressReleaseList','/feed/PressRelease.svc/GetPressReleaseList'],
                yearsUrl: ['/Services/PressReleaseService.svc/GetPressReleaseYearList','/feed/PressRelease.svc/GetPressReleaseYearList'],
                itemsResultField: 'GetPressReleaseListResult',
                yearsResultField: 'GetPressReleaseYearListResult',

                buildParams: function (o) {
                    var bodySelection = o.loadShortBody ? (o.loadBody ? 1 : 3) : (o.loadBody ? 2 : 0);
                    var obj = {
                        pressReleaseCategoryWorkflowId: o.category
                    }

                    if (o.usePublic) {
                        obj.bodyType = bodySelection,
                        obj.pressReleaseDateFilter = o.showFuture && !o.showPast ? 0 : (o.showPast && !o.showFuture ? 1 : 3);
                    } else {
                        obj.pressReleaseBodyType = bodySelection,
                        obj.pressReleaseSelection = o.showFuture && !o.showPast ? 0 : (o.showPast && !o.showFuture ? 1 : 3);
                    }

                    return obj;
                },

                parseItem: function (o, result) {
                    return {
                        title: this._truncate(result.Headline, o.titleLength),
                        url: result.LinkToDetailPage,
                        dateObj: new Date(result.PressReleaseDate),
                        year: new Date(result.PressReleaseDate).getFullYear(),
                        date: this._formatDate(result.PressReleaseDate),
                        tags: result.TagsList,
                        media: $.map(result.MediaCollection, function (item) {
                            return {
                                alt: item.Alt,
                                url: item.SourceUrl,
                                type: item.Style,
                                height: item.Height,
                                width: item.Width
                            };
                        }),
                        body: this._truncate(result.Body, o.bodyLength),
                        shortBody: this._truncate(result.ShortBody, o.shortBodyLength),
                        docUrl: result.DocumentPath,
                        docSize: result.DocumentFileSize,
                        docType: result.DocumentFileType,
                        seoName: result.SeoName,
                        thumb: result.ThumbnailPath || o.defaultThumb
                    };
                }
            },

            sec: {
                itemsUrl: ['/Services/SECFilingService.svc/GetEdgarFilingList','/feed/SECFiling.svc/GetEdgarFilingList'],
                yearsUrl: ['/Services/SECFilingService.svc/GetEdgarFilingYearList','/feed/SECFiling.svc/GetEdgarFilingYearList'],
                itemsResultField: 'GetEdgarFilingListResult',
                yearsResultField: 'GetEdgarFilingYearListResult',

                buildParams: function (o) {
                    return {
                        exchange: o.exchange,
                        symbol: o.symbol,
                        formGroupIdList: o.filingTypes.join(',')
                    };
                },

                parseItem: function (o, result) {
                    return {
                        id: result.FilingId,
                        description: this._truncate(result.FilingDescription, o.titleLength),
                        url: result.LinkToDetailPage,
                        dateObj: new Date(result.FilingDate),
                        year: new Date(result.FilingDate).getFullYear(),
                        date: this._formatDate(result.FilingDate),
                        agent: result.FilingAgentName,
                        person: result.ReportPersonName,
                        type: result.FilingTypeMnemonic,
                        docs: $.map(result.DocumentList, function (doc) {
                            return {
                                docType: doc.DocumentType,
                                docUrl: doc.Url
                            };
                        })
                    };
                }
            }
        }
    });


    /* Download Widget */

    /**
     * Fetches and displays downloads from the Q4 private API.
     * @class q4.downloads
     * @extends q4.api
     */
    $.widget('q4.downloads', $.q4.api, /** @lends q4.downloads */ {
        options: {
            /**
             * A Mustache.js template for the overall widget.
             * All the tags documented in the [q4.api](q4.api.html#option-template)
             * parent widget are available here.
             * In addition, the `{{#items}}` array contains these tags:
             *
             *<pre>
             * - `{{title}}`       The title of the download.
             * - `{{description}}` The download description.
             * - `{{url}}`         The URL of the document.
             * - `{{date}}`        The date of the download.
             * - `{{type}}`        The download type.
             * - `{{fileType}}`    The file type.
             * - `{{size}}`        The file size.
             * - `{{icon}}`        The URL of the document's icon.
             * - `{{thumb}}`       The URL of the document's thumbnail image.
             * - `{{#tags}}`       An array of tags for this download.
             *</pre>
             * @type {string}
             */
            template: '',
            /**
             * The download list category to pull from.
             * @type {string}
             * @example "Governance Documents"
             * @default null
             */
            downloadType: null
        }
    });


    /* Event Widget */

    /**
     * Fetches and displays events from the Q4 private API.
     * @class q4.events
     * @extends q4.api
     */
    $.widget('q4.events', $.q4.api, /** @lends q4.events */ {
        options: {
            /**
             * A Mustache.js template for the overall widget.
             * All the tags documented in the [q4.api](q4.api.html#option-template)
             * parent widget are available here.
             * In addition, the `{{#items}}` array contains these tags:
             *
             * - `{{title}}`             The title of the event.
             * - `{{url}}`               The URL of the details page.
             * - `{{id}}`                The event ID, for constructing calendar links.
             * - `{{date}}`              The starting date of the event.
             * - `{{endDate}}`           The ending date of the event.
             * - `{{timeZone}}`          The timezone of the start/end dates.
             * - `{{isFuture}}`          Whether the start date is in the future.
             * - `{{isPast}}`            Whether the end date is in the past.
             * - `{{location}}`          The location of the event.
             * - `{{#tags}}`             An array of tags for this event.
             * - `{{body}}`              The body of the event details.
             * - `{{webcast}}`           The URL of the webcast (if any).
             * - `{{#docs}}`             An array of attached documents, with these tags:
             *
             *   - `{{title}}`     The title of the document.
             *   - `{{url}}`       The URL of the document.
             *   - `{{type}}`      The type of document as specified in the CMS.
             *   - `{{extension}}` The extension of the document file name.
             *   - `{{size}}`      The size of the document file.
             * - `{{#speakers}}`         An array of the event's speakers, with these tags:
             *
             *   - `{{name}}`      The speaker's name.
             *   - `{{position}}`  The speaker's position or title.
             * - `{{#financialReports}}` An array of related financial reports.
             * - `{{#pressReleases}}`    An array of related press releases.
             * - `{{#presentations}}`    An array of related presentations.
             * @type {string}
             */
            template: ''
        }
    });


    /* Financial Report Widget */

    /**
     * Fetches and displays financial reports from the Q4 private API.
     * @class q4.financials
     * @extends q4.api
     */
    $.widget('q4.financials', $.q4.api, /** @lends q4.financials */ {
        options: {
            /**
             * A list of report subtypes to display, or an empty list to display all.
             * Valid values are:
             *
             * - `Annual Report`
             * - `Supplemental Report`
             * - `First Quarter`
             * - `Second Quarter`
             * - `Third Quarter`
             * - `Fourth Quarter`
             * @type {Array<string>}
             * @default
             */
            reportTypes: [],
            /**
             * A list of document categories to display.
             * Use an empty list to display all.
             * @type {Array<string>}
             * @example ["Financial Report", "MD&A", "Earnings Press Release"]
             * @default
             */
            docCategories: [],
            /**
             * A Mustache.js template for the overall widget.
             * All the tags documented in the [q4.api](q4.api.html#option-template)
             * parent widget are available here.
             * In addition, the `{{#items}}` array contains these tags:
             *
             * - `{{title}}` The title (i.e. subtype and year) of the financial report.
             * - `{{year}}`  The fiscal year of the financial report.
             * - `{{date}}`  The filing date of the financial report.
             * - `{{type}}`  The subtype of the report (e.g. `First Quarter`, `Annual Report`).
             * - `{{shortType}}` A shortened name for the financial report's subtype
             *   (e.g. `Q1`, `Annual`). These can be customized with the `shortTypes` option.
             * - `{{coverUrl}}`  The URL of the cover image, if any.
             * - `{{#docs}}` An array of documents for this report, with these tags:
             *
             *   - `{{docTitle}}`    The title of the document.
             *   - `{{docUrl}}`      The URL of the document file.
             *   - `{{docCategory}}` The category of the document.
             *   - `{{docSize}}`     The file size of the document.
             *   - `{{docThumb}}`    The URL of the thumbnail image, if any.
             *   - `{{docIcon}}`     The URL of the icon image, if any.
             *   - `{{docType}}`     The file type of the document.
             * @type {string}
             */
            template: ''
        },

        _sortItemsByType: function (items) {
            var o = this.options,
                types = [],
                itemsByType = {};

            // create an object of items sorted by type
            $.each(items, function (i, item) {
                if ($.inArray(item.type, types) == -1) {
                    // keep an array of types to preserve order
                    types.push(item.type);
                    itemsByType[item.type] = [];
                }
                $.each(item.docs, function (i, doc) {
                    itemsByType[item.type].push(doc);
                });
            });

            // return the types object
            return $.map(types, function (type, i) {
                return {
                    type: type,
                    shortType: o.shortTypes[type],
                    items: itemsByType[type]
                };
            });
        },

        _buildTemplateData: function (items) {
            var _ = this,
                tplData = this._super(items);

            // add types object to all items, and each year's items
            tplData.types = this._sortItemsByType(tplData.items);
            $.each(tplData.years, function (i, tplYear) {
                tplYear.types = _._sortItemsByType(tplYear.items);
            });

            return tplData;
        }
    });


    /* Presentation Widget */

    /**
     * Fetches and displays presentations from the Q4 private API.
     * @class q4.presentations
     * @extends q4.api
     */
    $.widget('q4.presentations', $.q4.api, /** @lends q4.presentations */ {
        options: {
            /**
             * A Mustache.js template for the overall widget.
             * All the tags documented in the [q4.api](q4.api.html#option-template)
             * parent widget are available here.
             * In addition, the `{{#items}}` array contains these tags:
             *
             * - `{{title}}`   The title of the presentation.
             * - `{{url}}`     The URL of the details page.
             * - `{{date}}`    The date of the presentation.
             * - `{{#tags}}`   An array of tags for this presentation.
             * - `{{body}}`    The body of the presentation details.
             * - `{{docUrl}}`  The URL of the presentation document.
             * - `{{docSize}}` The size of the presentation document.
             * - `{{docType}}` The file type of the presentation document.
             * - `{{thumb}}`   The URL of the thumbnail image, if any.
             * @type {string}
             */
            template: ''
        }
    });


    /* Press Release Widget */

    /**
     * Fetches and displays press releases from the Q4 private API.
     * @class q4.news
     * @extends q4.api
     */
    $.widget('q4.news', $.q4.api, /** @lends q4.news */ {
        options: {
            /**
             * The ID of the PR category to fetch. Defaults to all.
             * @type {string}
             */
            category: '00000000-0000-0000-0000-000000000000',
            /**
             * Whether to fetch the body of the press releases.
             * @type {boolean}
             * @default
             */
            loadBody: true,
            /**
             * Whether to fetch the shortened body of the press releases.
             * @type {boolean}
             * @default
             */
            loadShortBody: true,
            /**
             * A Mustache.js template for the overall widget.
             * All the tags documented in the [q4.api](q4.api.html#option-template)
             * parent widget are available here.
             * In addition, the `{{#items}}` array contains these tags:
             *
             * - `{{title}}`   The title of the press release.
             * - `{{url}}`     The URL of the details page.
             * - `{{date}}`    The date of the press release.
             * - `{{#tags}}`   An array of tags for this press release.
             * - `{{body}}`    The body of the press release (truncated to `bodyLength`).
             * - `{{shortBody}}` The short body of the release (truncated to `shortBodyLength`).
             * - `{{docUrl}}`  The URL of the related document, if any.
             * - `{{docSize}}` The size of the related document, if any.
             * - `{{docType}}` The file type of the related document, if any.
             * - `{{thumb}}`   The URL of the thumbnail image, if any.
             * @type {string}
             */
            template: ''
        }
    });


    /* SEC Filing Widget */

    /**
     * Fetches and displays SEC filings from the Q4 private API.
     * @class q4.sec
     * @extends q4.api
     */
    $.widget('q4.sec', $.q4.api, /** @lends q4.sec */ {
        options: {
            /**
             * The exchange of the stock symbol to look up.
             * If you are looking up the company by CIK, enter `CIK`.
             * @type {string}
             */
            exchange: '',
            /**
             * The stock symbol to look up.
             * If you are looking up the company by CIK, enter the CIK number here.
             * @type {string}
             */
            symbol: '',
            /**
             * An array of numeric filing types to filter by, or an empty list to skip filtering.
             * @type {Array<number>}
             */
            filingTypes: [],
            /**
             * Whether to exclude filings that have no associated documents.
             * @type {boolean}
             * @default
             */
            excludeNoDocuments: false,
            /**
             * A Mustache.js template for the overall widget.
             * All the tags documented in the [q4.api](q4.api.html#option-template)
             * parent widget are available here.
             * In addition, the `{{#items}}` array contains these tags:
             *
             * - `{{id}}`          The numeric ID of the filing.
             * - `{{description}}` A description of the filing.
             * - `{{url}}`         The URL of the details page.
             * - `{{date}}`        The date of the filing.
             * - `{{agent}}`       The name of the filing agent.
             * - `{{person}}`      The name of the reporting agent.
             * - `{{type}}`        The form type of the filing.
             * - `{{#docs}}`       An array of documents for this filing, with these tags:
             *
             *   - `{{docType}}` The file type of the document.
             *   - `{{docUrl}}`  The URL of the document.
             * @type {string}
             */
            template: ''
        }
    });

})(jQuery);
