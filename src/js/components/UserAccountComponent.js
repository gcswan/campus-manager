import * as React from 'react';
import * as _ from 'underscore';
const moment = require('moment');
const StripeCheckoutComponent = require('./StripeCheckoutComponent');
import {
  Row, Col, Panel, Table, FormGroup, InputGroup, FormControl, ControlLabel,
  Tabs, Tab
} from 'react-bootstrap';
const Select = require('react-select');
const CourseOptionComponent = require('./CourseOptionComponent');
const CourseValueComponent = require('./CourseValueComponent');
const CourseModel = require('../models/CourseModel');
const CoursesCollection = require('../collections/CoursesCollection');
const utils = require('../utils');

module.exports = React.createBackboneClass({
  mixins: [
    React.BackboneMixin('terms', 'update')
  ],

  getInitialState() {
    return {
      paymentAmount: 0,
      course: new CourseModel(),
      tabKey: this.getModel().get('courses').length ? 'tuition' : 'register'
    };
  },

  setValue(value) {
    this.setState({
      course: value.course
    });
  },

  changeAmount(e) {
    this.setState({
      paymentAmount: Number(e.currentTarget.value) * 100
    });
  },

  render() {
    const courses = new CoursesCollection();
    courses.comparator = courses.reverse;
    const currentCourse = this.getModel().currentCourse();
    const futureCourse = this.getModel().futureCourse();
    let totalCourseCost = 0;
    const courseCharges = [];
    let totalPaid = 0;

    this.getModel().get('courses').each(course => {
      if (course.get('cost') && course.get('cost') > 0) {
        totalCourseCost += this.getModel().get('price') || course.get('cost');
        courseCharges.push(
          <tr key={course.id + course.get('cost')}>
            <td>$-{Number(this.getModel().get('price') || course.get('cost')).toFixed(2)}</td>
            <td>{course.get('name')} ({course.get('term').get('name')})</td>
          </tr>
        );
      }
    });

    let credits = 0;
    this.getModel().get('credits').forEach((credit, idx) => {
      credits += Number(credit.amount);
      totalCourseCost -= Number(credit.amount);
      courseCharges.push(
        <tr key={idx}>
          <td>${Number(credit.amount).toFixed(2)}</td>
          <td>{credit.name}</td>
        </tr>
      );
    });

    if (currentCourse && currentCourse.id && currentCourse.get('seats') > 0) {
      currentCourse.set('registered', true);
      courses.add(currentCourse);
    }

    if (futureCourse && futureCourse.get('seats') > 0) {
      futureCourse.set('registered', true);
      courses.add(futureCourse);
    } else {
      this.props.terms.each(term => {
        term.get('courses').each(course => {
          if (
            course.get('location').get('city') === this.getModel().get('campus') &&
            course.get('seats') > 0
          ) {
            courses.add(course);
          }
        });
      });
    }

    const options = [];

    courses.each(course => {
      const label = `${course.get('name')}
      ${course.get('location').get('name')}
      ${course.get('location').get('address')}
      ${course.get('location').get('city')}
      ${course.get('location').get('state')}
      ${course.get('location').get('zipcode')}`;
      options.push({
        value: course.id,
        label,
        course,
        user: this.getModel(),
        disabled: course.full() && !course.get('registered')
      });
    });

    const charges = _.map(_.filter(this.getModel().get('charges'), charge => {
      return charge.paid;
    }), charge => {
      totalPaid += ((charge.amount - charge.amount_refunded) / 100);
      return(
        <tr key={charge.created}>
          <td>{('$' + ((charge.amount - charge.amount_refunded) / 100).toFixed(2))}</td>
          <td>*{charge.source.last4}</td>
          <td>{moment.unix(charge.created).format('MM/DD/YY')}</td>
          <td>{charge.metadata && charge.metadata.course_name ? `${charge.metadata.course_name} (${charge.metadata.term_name})` : ''}</td>
          <td>{charge.id}</td>
        </tr>
      )
    });

    const balance = (totalPaid - totalCourseCost).toFixed(2);
    let runningBalance = totalPaid + credits;

    const tuitionSchedule = [];
    this.getModel().get('courses').forEach((course, idx) => {
      tuitionSchedule.push(
        <tr>
          <td>
            {course.get('term').get('name')}
          </td>
          <td>
            {course.get('name')}
          </td>
          <td>
            $490.00
          </td>
          <td>
            {moment(course.get('term').get('start_date')).subtract(2, 'week').format('ddd, MMM Do, YYYY')}
          </td>
          <td>
            {(runningBalance -= 490) >= 0 ? '$0.00' : (<span className="score60">{`$${(runningBalance - 490 <= -490 ? -490 : runningBalance - 490).toFixed(2)}`}</span>)}
          </td>
        </tr>
      );
      const courseCost = this.getModel().get('price') - 490;
      tuitionSchedule.push(
        <tr>
          <td></td>
          <td></td>
          <td>
            {`$${(courseCost).toFixed(2)}`}
          </td>
          <td>
            {moment(course.get('term').get('start_date')).subtract(1, 'week').format('ddd, MMM Do, YYYY')}
          </td>
          <td>
            {(runningBalance -= courseCost) >= 0 ? '$0.00' : (<span className="score60">{`$${(runningBalance < -courseCost ? -courseCost : runningBalance).toFixed(2)}`}</span>)}
          </td>
        </tr>
      );
    });

    return (
      <Panel
        header={<h3>Account</h3>}
        footer={
          <small>
            Initial deposit must be $490.00 for any course. Contact admissions at&nbsp;
            <a href={`mailto: info@${utils.campusKey(this.getModel())}codingacademy.com`}>
              {`info@${utils.campusKey(this.getModel())}codingacademy.com`}
            </a> for support.
          </small>
        }
      >
        <Row>
          <Col xs={12}>
            <Tabs defaultActiveKey={this.state.tabKey} id="account-tabs">
              <Tab eventKey={'register'} title={this.getModel().get('courses').length ? 'Make A Payment' : 'Register'}>
                <br />
                <FormGroup controlId="course-payment">
                  <ControlLabel>
                    1. {this.getModel().get('courses').length ? 'What are you paying for?' : 'What course would you like to take?'}
                  </ControlLabel>
                  <Select
                    name="courses"
                    options={options}
                    optionComponent={CourseOptionComponent}
                    placeholder="Select a course"
                    valueComponent={CourseValueComponent}
                    value={this.state.course.id}
                    onChange={this.setValue}
                    id="course-payment"
                    data-test="course-payment"
                  />
                </FormGroup>
                <FormGroup controlId="payment-amount">
                  <ControlLabel>
                    2. Enter Payment Amount
                    {
                      !this.getModel().get('courses').length ?
                      <small>&nbsp; (Initial deposit must be $490.00 for any course.)</small>
                      :
                      ''
                    }
                  </ControlLabel>
                  <InputGroup>
                    <InputGroup.Addon>$</InputGroup.Addon>
                    <FormControl
                      type="text"
                      placeholder="0.00"
                      onChange={this.changeAmount}
                    />
                  </InputGroup>
                </FormGroup>
                <StripeCheckoutComponent
                  model={this.getModel()}
                  paymentAmount={this.state.paymentAmount}
                  course={this.state.course}
                  currentUser={this.props.currentUser}
                  balance={balance}
                />
              </Tab>
              <Tab eventKey={'tuition'} title="Tuition Schedule">
                <Table striped>
                  <thead>
                    <tr>
                      <th>Term</th>
                      <th>Course</th>
                      <th>Tuition</th>
                      <th>Due Date</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>{tuitionSchedule}</tbody>
                </Table>
              </Tab>
              <Tab eventKey={'invoice'} title="Invoice">
                <Table striped>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>{courseCharges}</tbody>
                  <tfoot></tfoot>
                </Table>
              </Tab>
              <Tab eventKey={'payments'} title="Payments">
                <Table striped>
                  <thead>
                    <tr>
                      <th>Paid</th>
                      <th>Card</th>
                      <th>Date</th>
                      <th>Course</th>
                      <th>ID</th>
                    </tr>
                  </thead>
                  <tbody>{charges}</tbody>
                </Table>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Panel>
    );
  }
});
