var React = require('react');

var ContentEditable = React.createClass({
    getDefaultProps: function() {
        return {html: ""};
    },

    render: function(){
        return <div {...this.props}
            onInput={this.emitChange}
            onBlur={this.emitChange}
            contentEditable={true}
            dangerouslySetInnerHTML={{__html: this.props.html}}></div>;
    },

    shouldComponentUpdate: function(nextProps){
        console.debug('shouldComponentUpdate');
        return nextProps.html !== this.getDOMNode().innerHTML;
    },

    moveCursorToEnd: function() {
        var range = document.createRange();
        range.selectNodeContents(this.getDOMNode());
        range.collapse(false);

        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        console.info('Moved cursor to end of ContentEditable');
    },

    componentDidUpdate: function() {
        console.debug('componentDidUpdate');
        if(this.props.html !== this.getDOMNode().innerHTML) {
           this.getDOMNode().innerHTML = this.props.html;
        }
       setTimeout(this.moveCursorToEnd, 1);
    },

    emitChange: function(evt) {
        console.debug('emitChange');
        if(!this.props.onChange) return;

        var html = this.getDOMNode().innerHTML;
        if(html === this.lastHtml) return;

        if(!evt.target) evt.target = {value: html};
        else evt.target.value = html;

        this.props.onChange(evt);

        this.lastHtml = html;
    }
});

module.exports = ContentEditable;
