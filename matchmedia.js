/**!
 * MatchMedia Polyfill
 * Add matchMedia support to IE9+
 * The goal was to create a polfyfill that would make it possible to fully utilize
 * matchMedia without a separate fallback in projects that support IE9+.
 *
 * @author: Luke Peavey
 * Date: 2016
 */


window.matchMedia = (function ( window, document, undefined ) {
    var nativeMatchMedia = window.matchMedia || window.msMatchMedia,
        MediaQueryObserver,
        styleMedia,
        style,
        script,
        info;

    if ( nativeMatchMedia ) {
        //return nativeMatchMedia;
    }

    // styleMedia polyfill
    // from Paul Irish's matchMedia polyfill http://githib.io/paulirish/matchmedia
    if ( ! ( styleMedia = (window.styleMedia || window.media) ) ) {

        style  = document.createElement( 'style' );
        script = document.getElementsByTagName( 'script' )[ 0 ];

        style.id   = '_mq-test';
        style.type = 'text/css';

        ( script && script.parentNode.insertBefore( style, script ) ) || document.head.appendChild( style );
        // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
        info = ( 'getComputedStyle' in window) && window.getComputedStyle( style, null ) || style.currentStyle;

        styleMedia = {
            matchMedium : function ( media ) {
                var text = '@media ' + media + '{ #_mq-test { width: 1px; } }';
                // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                if ( style.styleSheet ) {
                    style.styleSheet.cssText = text;
                } else {
                    style.textContent = text;
                }
                // Test if media query is true or false
                return info.width === '1px';
            }
        };
    }

    // For IE8 and below, return a basic matchMedia function
    // which tests a media query and returns a static result
    if ( ! (Function.prototype.bind && window.addEventListener && Array.prototype.map) ) {
        return function matchMedia( media ) {
            return {
                media   : typeof media === 'string' ? media : 'all',
                matches : styleMedia.matchMedium( media )
            }
        }
    }


    MediaQueryObserver = {
        mediaQueryLists : [],

        bind : function bind( mediaQueryList ) {
            this.mediaQueryLists.push( mediaQueryList );
        },

        unbind : function unbind( mediaQueryList ) {
            this.mediaQueryLists = this.mediaQueryLists.filter( function ( obj ) {
                return obj !== mediaQueryList;
            } )
        },

        // This monitors mediaQueryList objects and notifies listeners when the media query
        // result changes.
        observeMediaQueries : function observeMediaQueries() {
            if ( ! this.mediaQueryLists.length ) {
                return;
            }

            // Loop through the mediaQueryList objects...
            // check each one to see if the media query result has changed.
            this.mediaQueryLists.forEach( function ( mediaQueryList ) {
                // If the media result has changed...
                if ( mediaQueryList.matches !== mediaQueryList._data.status ) {
                    // update the cached media query result
                    mediaQueryList._data.status = ! mediaQueryList._data.status;
                    // Call each of the listener functions attached to this mediaQueryList/.
                    // Listener functions are passed the MediaQueryList object as the first argument
                    // and the context (same as native)
                    mediaQueryList._data.listeners.forEach( function ( listener ) {
                        listener.call( mediaQueryList, mediaQueryList );
                    } );
                }
            } )
        },

        init : function init() {
            // Make sure there is only one instance of this on the page
            if ( window.MediaQueryObserver ) window.MediaQueryObserver.destroy();
            // attach an event listener to resize event
            window.addEventListener( 'resize', this.observeMediaQueries = this.observeMediaQueries.bind( this ) );
            window.MediaQueryObserver = this;
        },

        destroy : function destroy() {
            window.removeEventListener( 'resize', this.observeMediaQueries );
        }
    };

    MediaQueryObserver.init();

    /**
     * A MediaQueryList object maintains a list of media queries on a document
     * and handles sending notifications to listeners when the result of the media
     * query changes.
     *
     * The matchMedia function returns a new MediaQueryList object.
     */
    function MediaQueryList( media ) {
        this.media = typeof media === 'string' ? media : 'not all';

        // "private" properties
        this._data = {
            listeners : [],
            status    : undefined
        };
    }

    Object.defineProperties( MediaQueryList.prototype, {
        // add listener
        'addListener' : {
            value    : function addListener( listenerFunction ) {
                var listeners = this._data.listeners;
                if ( typeof listenerFunction === 'function' ) {

                    if ( listeners.length === 0 ) {
                        // cache the current result of the media query
                        this._data.status = this.matches;
                        // Bind the mediaQueryList object to the MediaQueryObserver (this monitors media queries
                        // and notifies listners when the result changes)
                        MediaQueryObserver.bind( this );
                    }

                    // Add the provided listener function to the array of listeners for this mediaQueryList
                    // object.
                    listeners.push( listenerFunction );
                }
            },
            writable : true
        },

        // remove listener
        'removeListener' : {
            value    : function removeListener( listenerFunction ) {
                // Remove the listenerFunction from the array of listeners for this mediaQueryList object
                this._data.listeners = this._data.listeners.filter( function ( fn ) {
                    return fn !== listenerFunction;
                } );
                // If there are no other listeners on this mediaQueryList object,
                // 'unbind' it from the MediaQueryObserver
                if ( this._data.listeners.length === 0 ) {
                    MediaQueryObserver.unbind( this );
                }
            },
            writable : true,
        },

        // matches is a dynamic property: it returns the current result of the media query
        // each time it is accessed. (same as native)
        matches : {
            get : function matches() {
                return styleMedia.matchMedium( this.media )
            }
        }
    } );

    /**
     * matchMedia function (IE9+)
     * Returns a MediaQueryList object (similar to native matchMedia)
     */
    return function matchMedia( media ) {
        return new MediaQueryList( media );
    }
})( window, document );