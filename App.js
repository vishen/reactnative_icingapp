import React, { Component } from 'react';
import {
  Button,
  View,
  StyleSheet,
  Text,
  Picker,
  PushNotificationIOS,
  AsyncStorage,
  Switch,
} from 'react-native';
import { StackNavigator } from 'react-navigation';

import { Timer } from 'react-native-stopwatch-timer'

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: "Home",
  };

  componentDidMount(){
    var that = this;
    /*PushNotification.configure({
      onNotification: function(notification) {
        console.log("################################################################");
        console.log("Notification: " + notification);
        that.props.navigation.navigate("Details");
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
    });*/
  };

  // Initial defaults
  state = {
    notificationTiming: "2",
    isActive: false,
    timerDuration: "20",
  };

  render() {
    return (
      <View style={styles.main}>
        <Switch
          onValueChange={ (value) => this.setState({isActive: value})}
          value={this.state.isActive}
        />
        <Text style={styles.helpText}> NOTE: Turning this off remove any scheduled notifications </Text>
        <Text> Get reminded to ice every: </Text>
        <Picker
          style={{height:30, width:100}}
          selectedValue={this.state.notificationTiming}
          onValueChange={(v, i) => this.setState({notificationTiming: v})}
          enabled={this.state.isActive}
        >
          <Picker.Item label="1 Hour" value="1" />
          <Picker.Item label="2 Hours" value="2" />
          <Picker.Item label="3 Hours" value="3" />
          <Picker.Item label="4 Hours" value="4" />
          <Picker.Item label="5 Hours" value="5" />
          <Picker.Item label="6 Hours" value="6" />
        </Picker>
        <Text> How long should the ice timer be:  </Text>
        <Picker
          style={{height:30, width:125}}
          selectedValue={this.state.timerDuration}
          onValueChange={(v, i) => this.setState({timerDuration: v})}
          enabled={this.state.isActive}
        >
          <Picker.Item label="5 minutes" value="5" />
          <Picker.Item label="10 minutes" value="10" />
          <Picker.Item label="15 minutes" value="15" />
          <Picker.Item label="20 minutes" value="20" />
          <Picker.Item label="25 minutes" value="25" />
          <Picker.Item label="30 minutes" value="30" />
        </Picker>
        <Button
          title="Go to timer"
          onPress={() => this.props.navigation.navigate("Timer")}
        />
      </View>
    );
  }
}

class TimerScreen extends React.Component {
  static navigationOptions = {
    title: "Timer",
  };

  state = {
    timerStart: false,
    timerDurationSeconds: 20 * 1000,
  };

  timerComplete() {
    // Remove all notifications AND
    // Schedule a new notification
    this.setState({timerStart: false});
  };

  timerStartOrPause() {
    // Remove all notificatinos AND
    // Schedule a new notification
    this.setState({timerStart: !this.state.timerStart});
  };

  render() {
    return (
      <View style={styles.timerScreen}>
        <Timer
          totalDuration={this.state.timerDurationSeconds} msecs start={this.state.timerStart}
          handleFinish={ () => this.timerComplete() }
          options={timerStyleOptions}
        />
        <Button
          title={!this.state.timerStart ? "Start Icing Now" : "Pause"}
          onPress={() => this.timerStartOrPause()}
        />
      </View>
    );
  };
}

const timerStyleOptions = {
  container: {
    backgroundColor: "#FFF",
    padding: 5,
    borderRadius: 2,
    width: 220,
  },
  text: {
    fontSize: 30,
    color: "#000",
    marginLeft: 7,
  }
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  timerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  helpText: {
    fontSize: 15,
  },
});

export default StackNavigator({
  Home: { screen: HomeScreen },
  Timer: { screen: TimerScreen },
}, { initialRouteName: "Home" });

/*
import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit App.js
        </Text>
        <Text style={styles.instructions}>
          {instructions}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
*/
