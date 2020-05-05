define(function (require) {

    var Adapt = require('coreJS/adapt');

    var NotifyView = Backbone.View.extend({

        className: 'notify',
        disableAnimation: false,
        escapeKeyAttached: false,

        initialize: function () {
            this.disableAnimation = Adapt.config.has('_disableAnimation') ? Adapt.config.get('_disableAnimation') : false;

            this.setupEventListeners();

            //include accessibility globals in notify model
            this.model.set('_globals', Adapt.course.get('_globals'));
            this.render();
        },

        setupEventListeners: function () {
            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'device:resize', this.resetNotifySize);
            this.listenTo(Adapt, 'accessibility:toggle', this.onAccessibilityToggle);
            this._onKeyUp = _.bind(this.onKeyUp, this);
            this.setupEscapeKey();
        },

        setupEscapeKey: function () {
            var hasAccessibility = Adapt.config.has('_accessibility') && Adapt.config.get('_accessibility')._isActive;

            if (!hasAccessibility && !this.escapeKeyAttached) {
                $(window).on("keyup", this._onKeyUp);
                this.escapeKeyAttached = true;
            } else {
                $(window).off("keyup", this._onKeyUp);
                this.escapeKeyAttached = false;
            }
        },

        onAccessibilityToggle: function () {
            this.setupEscapeKey();
        },

        onKeyUp: function (event) {
            if (event.which != 27) return;
            event.preventDefault();

            this.closeNotify();
        },

        events: {
            'click .notify-popup-alert-button': 'onAlertButtonClicked',
            'click .notify-popup-prompt-button': 'onPromptButtonClicked',
            'click .notify-popup-done': 'onCloseButtonClicked',
            'click .notify-shadow': 'onCloseButtonClicked',
            'click .custom-button-in-notify button': 'onCustomButtonInNotifyClicked',
        },

        render: function () {
            var data = this.model.toJSON();
            var template = Handlebars.templates['notify'];

            //hide notify container
            this.$el.css("visibility", "hidden");
            //attach popup + shadow
            this.$el.html(template(data)).prependTo('body');
            //hide popup
            this.$('.notify-popup').css("visibility", "hidden");
            //show notify container
            this.$el.css("visibility", "visible");

            this.showNotify();
            return this;
        },

        onAlertButtonClicked: function (event) {
            event.preventDefault();
            //tab index preservation, notify must close before subsequent callback is triggered
            this.closeNotify();
            Adapt.trigger(this.model.get('_callbackEvent'), this);
        },

        onPromptButtonClicked: function (event) {
            event.preventDefault();
            //tab index preservation, notify must close before subsequent callback is triggered
            this.closeNotify();
            Adapt.trigger($(event.currentTarget).attr('data-event'));
        },
        onCustomButtonInNotifyClicked: function (event) {
            event.preventDefault();
            var buttonID = $(event.currentTarget).data('id');
            buttonID = buttonID.replace("pop-", "");
            var scs_item = buttonID.replace("notify", "item-anchor");
            //$("[data-id='" + scs_item + "']").addClass('visited-icon');
            $("[data-id='" + buttonID + "']").trigger('click');
        },


        onCloseButtonClicked: function (event) {
            event.preventDefault();
            //tab index preservation, notify must close before subsequent callback is triggered
            this.closeNotify();
            Adapt.trigger("notify:cancelled");
        },

        resetNotifySize: function () {
            $('.notify-popup').removeAttr('style');

            this.resizeNotify();
        },

        resizeNotify: function () {
            var windowHeight = $(window).height();
            var notifyHeight = this.$('.notify-popup').outerHeight();
            //alert(notifyHeight)
            var windowWidth = $(window).width();
            var pageWidth = $("#wrapper").width();
            var remainingWindowWidth = windowWidth - pageWidth;
            var overflow = "hidden";
            var newh = "auto";
            //alert(notifyHeight + "   " + windowHeight)
            if ((notifyHeight + 50) > windowHeight) {
                overflow = 'auto';
                newh = windowHeight;
            }

            if ((notifyHeight) > windowHeight) {
                this.$('.notify-popup').css({
                    'top': 0,
                    'overflow-y': overflow,
                    '-webkit-overflow-scrolling': 'touch',
                    'height': 'auto',
                    'max-height': newh
                });
            } else {
                this.$('.notify-popup').css({
                    'margin-top': -(notifyHeight / 2),
                    'overflow-y': overflow,
                    'height': newh
                });
            }

            var min_width = "auto";
            var min_height = "auto";
            var max_width = "auto";
            var pop_width = this.$('.notify-popup').outerWidth();
            var left = "auto";
            var right = "auto";
            if (windowWidth <= 520) {
                //alert('a')
                //for smaller devices having width <=768 notify popup will be in full height and width
                left = "auto";
                right = "auto";
                pop_width = "auto";
                min_width = "100%";
                min_height = "100%";
                max_width = "100%";

                this.$('.notify-popup').css({
                    'margin-top': "0",
                    'top': "0"
                });
            }
            else {
                if (this.$('.notify-popup').hasClass("openChildNotifyPopup")) {
                    //alert('b')
                    //to open child notify popup in imagessquare and simplecasestudy width fixed width 710px
                    pop_width = 710;
                    max_width = 710;
                }
                else {
                    //alert('c')
                    if (this.$('.notify-popup').hasClass("notify-correct-incorrect-feedback")) {
                        //to open notify popup in imagessquare and simplecasestudy width fixed width 640px
                        pop_width = "auto";
                        pop_width = 640;
                    }
                    pop_width = 640;
                    max_width = 640;
                }

                if ((windowWidth > 520) && (windowWidth <= 640)) {
                    left = "auto";
                    right = "auto";
                }
                else {
                    left = (((pageWidth - pop_width) / 2) + (remainingWindowWidth / 2));
                    right = left;
                }
            }


            //alert('pageWidth ' + pageWidth + "   pop_width  " + pop_width + "   remainingWindowWidth  " + remainingWindowWidth)
            //to apply custom css
            this.$('.notify-popup').css({
                'left': left + "px",
                'right': right + "px",
                //'width': pop_width + "px",
                'width': "auto",
                'min-width': min_width,
                'min-height': min_height,
                'max-width': max_width
            });

            //to set css for bookmarking popup
            if (this.$('.notify-popup').hasClass('notify-default-square-buttons')) {
                if (this.$('.notify-popup').find("[data-event='bookmarking:continue']").attr('class') != undefined) {
                    this.$('.notify-popup').css({
                        'left': "29.1%",
                        'right': "29.1%",
                        'max-width': "41.8%"
                    });
                }
            }
        },

        showNotify: function () {

            Adapt.trigger('notify:opened', this);

            if (this.$("img").length > 0) {
                this.$el.imageready(_.bind(loaded, this));
            } else {
                loaded.call(this);
            }

            function loaded() {
                if (this.disableAnimation) {
                    this.$('.notify-shadow').css("display", "block");
                } else {

                    this.$('.notify-shadow').velocity({ opacity: 0 }, { duration: 0 }).velocity({ opacity: 1 }, {
                        duration: 400, begin: _.bind(function () {
                            this.$('.notify-shadow').css("display", "block");
                        }, this)
                    });

                }

                this.resizeNotify();

                if (this.disableAnimation) {

                    this.$('.notify-popup').css("visibility", "visible");
                    complete.call(this);

                } else {

                    this.$('.notify-popup').velocity({ opacity: 0 }, { duration: 0 }).velocity({ opacity: 1 }, {
                        duration: 400, begin: _.bind(function () {
                            this.$('.notify-popup').css("visibility", "visible");
                            complete.call(this);
                        }, this)
                    });

                }

                function complete() {
                    /*ALLOWS POPUP MANAGER TO CONTROL FOCUS*/
                    Adapt.trigger('popup:opened', this.$('.notify-popup'));
                    $('body').scrollDisable();

                    //set focus to first accessible element
                    this.$('.notify-popup').a11y_focus();
                }
            }

            /*
                Add inlineglossary inside the course.json glossary content to open inline glossary content.
            */
            $(".inlineglossary").click(function() {
                Adapt.course.set('inlineglossaryclicked', true);
                /*Check notify exists*/
                if($('.notify').length>1) {
                    return false;
                }

                /* Get Data */
                var _sAbbr = $(this).attr("title"),
                    _sTitle = '',
                    _sDesc = '';
                _.each(Adapt.course.get('_glossary')._glossaryItems, function(item, index) {
                    //console.log('item.abbr: ' , item.abbr, 'item.title: ' , item.title, 'item.desc: ' , item.desc);
                    if(item.abbr == _sAbbr) {
                        _sTitle = item.title;
                        _sDesc = item.desc;
                        return false;
                    }
                });
                
                /* SPAN
                var $title = $(this).find(".title");
                if (!$title.length) {
                    $(this).append('<span class="title">' + $(this).attr("title") + '</span>');
                } else {
                    $title.remove();
                }
                */
                /* Popup */
				var alertObject = {
                    //title: $(this).html(),
                    title: _sTitle,
                    //body: $(this).attr("title"),
                    body: _sDesc,
                    confirmText: "",
                    _callbackEvent: "", //"assessment:notPassedAlert",
                    _showIcon: false,
                };
                //TODO: Focus on popup.
                //this.blur();
                Adapt.trigger('notify:popup', alertObject);
                $('.notify').eq(0).css({'z-index': 1});

                //Dummy popup for inline glossary
                /*
                $('<div class="notify-glossary"><div class="notify-popup"><div class="notify-popup-inner"><div class="notify-popup-content"><div class="notify-popup-content-inner"><div class="notify-popup-title"><div class="notify-popup-title-inner h5" tabindex="-1" role="heading" aria-level="1" aria-hidden="true">'+_sTitle+'</div></div><div class="notify-popup-body"><div class="notify-popup-body-inner">'+_sDesc+'</div></div></div></div><button class="base notify-popup-done" aria-label="Close popup" tabindex="0"><div class="notify-popup-icon-close icon icon-cross"></div></button></div></div><div class="notify-shadow" style="opacity: 1; display: block;"></div></div>').appendTo($('body')).css({'opacity':0}).animate({opacity: 1}, 1000);*/
            });

        },

        closeNotify: function (event) {
            console.log('closeNotify');
            /*
            if(Adapt.course.get('inlineglossaryclicked') == true) {
                this.$('.notify-popup').css("visibility", "hidden");
                this.$el.css("visibility", "hidden");
                this.remove();
                Adapt.course.set('inlineglossaryclicked', false);
                return false;
            }
            
            if(Adapt.course.get('glossaryclicked') == true) {
                this.$('.notify-popup').css("visibility", "hidden");
                this.$el.css("visibility", "hidden");
                this.remove();
                Adapt.course.set('glossaryclicked', false);
                return false;
            }
            */

            if (this.disableAnimation) {

                this.$('.notify-popup').css("visibility", "hidden");
                this.$el.css("visibility", "hidden");

                this.remove();

            } else {

                this.$('.notify-popup').velocity({ opacity: 0 }, {
                    duration: 400, complete: _.bind(function () {
                        this.$('.notify-popup').css("visibility", "hidden");
                    }, this)
                });

                this.$('.notify-shadow').velocity({ opacity: 0 }, {
                    duration: 400, complete: _.bind(function () {
                        this.$el.css("visibility", "hidden");
                        this.remove();
                    }, this)
                });
            }

            $('body').scrollEnable();
            Adapt.trigger('popup:closed');
            Adapt.trigger('notify:closed');


            var child_pop = $(".notify").find(".openChildNotifyPopup");
            if (child_pop.attr("class") != undefined) {
                //trigger parent popup on close on child popup
                $("[data-id='" + $(".notify").find(".notify-popup").attr("working-Index") + "']").trigger('click');
            }
        }

    });

    return NotifyView;

});
