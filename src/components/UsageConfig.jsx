import React from 'react';
import { connect } from 'react-redux';
import { updateConfigUsage } from '../actionCreator.js';
import { Radio, Icon, Row, Col, Button } from 'antd';
import '../style/config.less'


const RadioButton = Radio.Button;
const RadioGroup = Radio.Group;

class Config extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      configUsage: 'SEND_ASSISTANT'
    };
  }
  handleConfigChange = (e) => {
    this.setState({
      configUsage: e.target.value
    });
    console.log(e.target.value);
  };
  submitConfig = () => {
    this.props.updateConfigUsage(this.state.configUsage)
  };
  render () {
    return (
      <div>
        <Row>
          <RadioGroup defaultValue='SEND_ASSISTANT'
            size="large" className='config-group'
            onChange={this.handleConfigChange}>
            <RadioButton value='SEND_ASSISTANT'>
              <div>
                <Icon className='icon-type' type='message'></Icon>
                <p>群发助手</p>
              </div>
            </RadioButton>
            <RadioButton value='UPDATE_REMARK'>
              <div>
                <Icon className='icon-type' type='retweet'></Icon>
                <p>同步助手</p>
              </div>
            </RadioButton>
          </RadioGroup>
        </Row>
        <Row>
          <Col span='4' offset='15'>
            <Button size='large'
              className='entrance' icon='enter'
              onClick={this.submitConfig}></Button>
          </Col>
        </Row>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return state;
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    updateConfigUsage: (configStatus) => {
      dispatch(updateConfigUsage(configStatus));
    }
  }
};

const UsageConfig = connect(
  mapStateToProps,
  mapDispatchToProps
)(Config);

export default UsageConfig;