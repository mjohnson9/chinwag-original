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
        return nextProps.html !== this.getDOMNode().innerHTML;
    },

    componentDidUpdate: function() {
        if(this.props.html !== this.getDOMNode().innerHTML) {
           this.getDOMNode().innerHTML = this.props.html;
        }
    },

    emitChange: function(evt) {
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
