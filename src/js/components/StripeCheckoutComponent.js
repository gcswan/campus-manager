import * as React from 'react';
import * as Backbone from 'backbone';
import StripeCheckout from 'react-stripe-checkout';
import { Button } from 'react-bootstrap';
const FontAwesome = require('react-fontawesome');

module.exports = React.createBackboneClass({
  getInitialState() {
    return {
      paymentAmount: this.props.paymentAmount,
      course: this.props.course
    };
  },

  onToken(token) {
    $.ajax('/api/charges/' + token.id, {
      method: 'POST',
      data: {
        amount: this.state.paymentAmount,
        card_id: token.card.id,
        course_id: this.state.course.id,
        user_id: this.getModel().id
      },
      success: () => {
        this.setState({
          paymentAmount: 0
        });
        Backbone.$.ajax('/api/registrations', {
          method: 'POST',
          data: {
            courseId: this.state.course.id,
            userId: this.getModel().id,
            track: true
          },
          success: () => {
            this.state.course.get('registrations').add(this.getModel());
            this.getModel().fetch();
          },
          error: (model, res) => {
            this.setState({
              error: res.responseJSON.message,
              alertVisible: ''
            });
          }
        });
      }
    });
  },

  componentWillReceiveProps(nextProps) {
    this.setState({
      paymentAmount: nextProps.paymentAmount,
      course: nextProps.course,
      balance: nextProps.balance
    });
  },

  render() {
    return (
      <StripeCheckout
        token={this.onToken}
        stripeKey={process.env.STRIPE_PUBLISHABLE_KEY}
        name="Austin Coding Academy"
        description="Campus Manager"
        data-locale="auto"
        zipCode={true}
        amount={this.state.paymentAmount}
        email={this.getModel().get('username')}
      >
        <Button block bsStyle="primary" disabled={!(this.state.course.id && Number(this.state.paymentAmount) > 0 && (Number(this.state.paymentAmount) / 100 >= 490 || this.props.currentUser.get('is_admin') || this.state.balance < 0))} data-test="make-payment">
          <FontAwesome name="credit-card" /> 3. Pay With Card
        </Button>
      </StripeCheckout>
    );
  }
});
