if (!jQuery.fn.find) {
  jQuery.fn.extend({
    find: function( selector ) {
      var i, ret, self,
      len = this.length;

      if ( typeof selector !== "string" ) {
        self = this;
        return this.pushStack( jQuery( selector ).filter(function() {
          for ( i = 0; i < len; i++ ) {
            if ( jQuery.contains( self[ i ], this ) ) {
              return true;
            }
          }
        }));
      }

      ret = [];
      for ( i = 0; i < len; i++ ) {
        jQuery.find( selector, this[ i ], ret );
      }
        
      // Needed because $( selector, context ) becomes $( context ).find( selector )
      ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
      ret.selector = ( this.selector ? this.selector + " " : "" ) + selector;
      return ret;
    }
  });
}

if (!jQuery.fn.on) {
  jQuery.fn.extend({
    on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
      var type, origFn;

      // Types can be a map of types/handlers
      if ( typeof types === "object" ) {
        // ( types-Object, selector, data )
        if ( typeof selector !== "string" ) {
          // ( types-Object, data )
          data = data || selector;
          selector = undefined;
        }
        for ( type in types ) {
          this.on( type, selector, data, types[ type ], one );
        }
        return this;
      }

      if ( data == null && fn == null ) {
        // ( types, fn )
        fn = selector;
        data = selector = undefined;
      } else if ( fn == null ) {
        if ( typeof selector === "string" ) {
          // ( types, selector, fn )
          fn = data;
          data = undefined;
        } else {
          // ( types, data, fn )
          fn = data;
          data = selector;
          selector = undefined;
        }
      }
      if ( fn === false ) {
        fn = returnFalse;
      } else if ( !fn ) {
        return this;
      }

      if ( one === 1 ) {
        origFn = fn;
        fn = function( event ) {
          // Can use an empty set, since event contains the info
          jQuery().off( event );
          return origFn.apply( this, arguments );
        };
        // Use same guid so caller can remove using origFn
        fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
      }
      return this.each( function() {
        jQuery.event.add( this, types, fn, data, selector );
      });
    }
  });
}

if (!jQuery.fn.one) {
  jQuery.fn.extend({
    one: function( types, selector, data, fn ) {
      return this.on( types, selector, data, fn, 1 );
    }
  });
}

if (!jQuery.fn.off) {
  jQuery.fn.extend({
    off: function( types, selector, fn ) {
      var handleObj, type;
      if ( types && types.preventDefault && types.handleObj ) {
        // ( event )  dispatched jQuery.Event
        handleObj = types.handleObj;
        jQuery( types.delegateTarget ).off(
          handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
          handleObj.selector,
          handleObj.handler
        );
        return this;
      }
      if ( typeof types === "object" ) {
        // ( types-object [, selector] )
        for ( type in types ) {
          this.off( type, selector, types[ type ] );
        }
        return this;
      }
      if ( selector === false || typeof selector === "function" ) {
        // ( types [, fn] )
        fn = selector;
        selector = undefined;
      }
      if ( fn === false ) {
        fn = returnFalse;
      }
      return this.each(function() {
        jQuery.event.remove( this, types, fn, selector );
      });
    }
  });
}