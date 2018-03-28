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

var PushNotification = require("react-native-push-notification");

function cancelAllNotifications() {
  PushNotification.cancelAllLocalNotifications();
};

function formatTimerDuration(v) {
  return Number(v) * 60 * 1000;  // Currently this is in seconds, needs to be in minutes!
}

function createNotification() {
  console.log("createNotification()");
  AsyncStorage.getItem("@icingappv1.notificationTiming:key").then((v) => {
    var seconds = Number(v);
    var now = Date.now();
    var dateScheduled = new Date(now + seconds * 1000);
    var message;
    if (seconds < 3600) {
      message = "It has been " + v + " seconds";
    } else if (seconds == 3600) {
      message = "It has been 1 hour";
    } else {
      message = "It has been " + v + " hours"
    }
    console.log("createNotification(): ", v, now, seconds, dateScheduled);
    PushNotification.localNotificationSchedule({
      title: "Time to ice!",
      message: message,
      date: dateScheduled,
    });
  });
};

async function storageAdd(key, value) {
  await AsyncStorage.setItem("@icingappv1." + key + ":key", value);
}

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: "Home",
  };

  componentDidMount(){
    var that = this;
    PushNotification.configure({
      onNotification: function(notification) {
        console.log("################################################################");
        console.log("Notification: ",  notification);
        AsyncStorage.getItem("@icingappv1.timerDuration:key").then((v) => {
          that.props.navigation.navigate("Timer", {timerDuration: formatTimerDuration(v), canCreateNotifications: true});
        });
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
    });
    AsyncStorage.getItem("@icingappv1.isActive:key").then((v) => {
      if (v === "true") {
        this.setState({isActive: true});
      } else {
        this.setState({isActive: false});
      }
    });
    AsyncStorage.getItem("@icingappv1.notificationTiming:key").then((v) => {
      this.setState({notificationTiming: v});
    });
    AsyncStorage.getItem("@icingappv1.timerDuration:key").then((v) => {
      this.setState({timerDuration: v});
    });
  };

  // Initial defaults
  state = {
    notificationTiming: "2",
    isActive: false,
    timerDuration: "20",
  };

  updateTimerDuration(v) {
    this.setState({timerDuration: v});
    storageAdd("timerDuration", v);
  };

  updateIsActive(v) {
    cancelAllNotifications();
    this.setState({isActive: v});
    if (v === true){
      storageAdd("isActive", "true");
      createNotification();
    } else {
      storageAdd("isActive", "false");
    }
  };

  updateNotificationTiming(v) {
    // TODO(): This isn't concurrent safe - needs to be a callback on the storageAdd or something!
    cancelAllNotifications();
    storageAdd("notificationTiming", v);
    this.setState({notificationTiming: v});
    createNotification();
  };

  render() {
    return (
      <View style={styles.main}>
        <View style={styles.mainChild}>
        <Switch
          onValueChange={ (v) => this.updateIsActive(v)}
          value={this.state.isActive}
        />
        <Text style={styles.helpText}> NOTE: Turning this off remove any scheduled notifications </Text>
        </View>
        <View style={styles.mainChild}>
        <Text> Get reminded to ice every: </Text>
        <Picker
          style={{height:30, width:150}}
          selectedValue={this.state.notificationTiming}
          onValueChange={(v, i) => this.updateNotificationTiming(v)}
          enabled={this.state.isActive}
        >
          <Picker.Item label="30 seconds" value="30" />
          <Picker.Item label="1 minute" value="60" />
          <Picker.Item label="1 Hour" value="3600" />
          <Picker.Item label="2 Hours" value="7200" />
          <Picker.Item label="3 Hours" value="10800" />
          <Picker.Item label="4 Hours" value="14400" />
          <Picker.Item label="5 Hours" value="18000" />
          <Picker.Item label="6 Hours" value="21600" />
        </Picker>
        </View>
        <View style={styles.mainChild}>
        <Text> How long should the ice timer be:  </Text>
        <Picker
          style={{height:30, width:150}}
          selectedValue={this.state.timerDuration}
          onValueChange={(v, i) => this.updateTimerDuration(v)}
        >
          <Picker.Item label="5 minutes" value="5" />
          <Picker.Item label="10 minutes" value="10" />
          <Picker.Item label="15 minutes" value="15" />
          <Picker.Item label="20 minutes" value="20" />
          <Picker.Item label="25 minutes" value="25" />
          <Picker.Item label="30 minutes" value="30" />
        </Picker>
        </View>
        <View style={styles.mainChild}>
        <Button
          title="Go to timer"
          onPress={() => this.props.navigation.navigate("Timer", {
            timerDuration: formatTimerDuration(this.state.timerDuration),
            canCreateNotifications: this.state.isActive,
          })}
        />
        </View>
      </View>
    );
  }
}

class TimerScreen extends React.Component {
  // TODO(): See if there is a callback to call before going back a screen, we need
  // to stop the timer running.
  static navigationOptions = {
    title: "Timer",
  };

  state = {
    timerStart: false,
    timerDurationSeconds: this.props.navigation.state.params.timerDuration,
    canCreateNotifications: this.props.navigation.state.params.canCreateNotifications,
  };

  timerComplete() {
    // Remove all notifications AND
    // Schedule a new notification
    if (this.state.canCreateNotifications) {
      cancelAllNotifications();
      createNotification();
    }

    this.setState({timerStart: false});
  };

  timerStartOrPause() {
    // Remove all notificatinos AND
    // Schedule a new notification
    if (this.state.canCreateNotifications) {
      cancelAllNotifications();
      createNotification();
    }

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
          title={!this.state.timerStart ? "Start" : "Pause"}
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
    paddingBottom: 30,
  },
  text: {
    fontSize: 30,
    color: "#000",
    marginLeft: 20,
  }
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  mainChild: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
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
