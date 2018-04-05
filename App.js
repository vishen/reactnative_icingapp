import React, { Component } from 'react';
import {
  Button,
  AppState,
  View,
  StyleSheet,
  Text,
  PushNotificationIOS,
  AsyncStorage,
  Switch,
  Platform,
} from 'react-native';
import { StackNavigator, NavigationActions } from 'react-navigation';
import { Timer } from 'react-native-stopwatch-timer'
import Picker from 'react-native-universal-picker'

var PushNotification = require("react-native-push-notification");

function cancelAllNotifications() {
  PushNotification.cancelAllLocalNotifications();
};

function formatTimerDuration(v) {
  return Number(v) * 60 * 1000;
}

function createNotification(extraTime) {
  extraTime = extraTime || 0;
  console.log("createNotification()");
  AsyncStorage.getItem("@icingappv1.notificationTiming:key").then((v) => {
    var seconds = Number(v) + extraTime;
    var now = Date.now();
    var dateScheduled = new Date(now + seconds * 1000);
    var message;
    if (seconds < 3600) {
      message = "It has been " + v + " seconds, time to ice!";
    } else if (seconds == 3600) {
      message = "It has been 1 hour, time to ice!";
    } else {
      message = "It has been " + (v / (60 * 60)) + " hours, time to ice!"
    }
    console.log("createNotification(): ", v, seconds, extraTime, dateScheduled);
    PushNotification.localNotificationSchedule({
      title: "Icing time!",
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
    this._mounted = true;
    var that = this;
    PushNotification.configure({
      onNotification: function(notification) {
        console.log("################################################################");
        console.log("Notification: ",  notification);
        if (this._mounted) {//notification.id != "1337") {
          AsyncStorage.getItem("@icingappv1.timerDuration:key").then((v) => {
            that.props.navigation.navigate("Timer", {timerDuration: formatTimerDuration(v), canCreateNotifications: true});
          });
        }
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
      if (v !== undefined && v !== null) {
        this.setState({notificationTiming: v});
      }
    });
    AsyncStorage.getItem("@icingappv1.timerDuration:key").then((v) => {
      if (v !== undefined && v !== null) {
        this.setState({timerDuration: v});
      }
    });
  };

  componentWillUnmount() {
    this._mounted = false;
  }

  // Initial defaults
  state = {
    notificationTiming: "7200",
    isActive: false,
    timerDuration: "20",
  };

  updateTimerDuration(v) {
    this.setState({timerDuration: v});
    storageAdd("timerDuration", v);
  };

  updateIsActive(v) {
    this.setState({isActive: v});
    if (v === true){
      storageAdd("isActive", "true");
      storageAdd("notificationTiming", this.state.notificationTiming);
      storageAdd("timerDuration", this.state.timerDuration);
    } else {
      storageAdd("isActive", "false");
      cancelAllNotifications();
    }
  };

  updateNotificationTiming(v) {
    // TODO(): This isn't concurrent safe - needs to be a callback on the storageAdd or something!
    storageAdd("notificationTiming", v);
    this.setState({notificationTiming: v});
  };

  render() {
    return (
      <View style={styles.main}>
        <View style={styles.mainChild}>
        <Switch
          onValueChange={ (v) => this.updateIsActive(v)}
          value={this.state.isActive}
        />
        <Text style={styles.helpText}> NOTE: Turning this off removes any scheduled notifications </Text>
        </View>
        <View style={styles.mainChild}>
        <Text> Get reminded to ice every: </Text>
        <Picker
          style={{height:30, width:150}}
          itemStyle={{textAlign: "center"}}
          selectedValue={this.state.notificationTiming}
          onValueChange={(v, i) => this.updateNotificationTiming(v)}
          enabled={this.state.isActive}
        >
          <Picker.Item label="1 Hour" value="3600" />
          <Picker.Item label="2 Hours" value="7200" />
          <Picker.Item label="3 Hours" value="10800" />
          <Picker.Item label="4 Hours" value="14400" />
          <Picker.Item label="5 Hours" value="18000" />
          <Picker.Item label="6 Hours" value="21600" />
        </Picker>
        </View>
        <View style={styles.mainChild}>
        <Text> You will be icing for:  </Text>
        <Picker
          style={{height:30, width:150}}
          itemStyle={{textAlign: "center"}}
          selectedValue={this.state.timerDuration}
          onValueChange={(v, i) => this.updateTimerDuration(v)}
          mode="dialog"
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
        <Text> Start icing timer to begin cycle </Text>
        <Button
          title="Go to timer"
          onPress={() => this.props.navigation.navigate("Timer", {
            timerDuration: formatTimerDuration(this.state.timerDuration),
            canCreateNotifications: true,
          })}
        />
        </View>
      </View>
    );
  }
}

class TimerScreen extends React.Component {
  static navigationOptions = {
    title: "Timer",
  };

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  };

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  };

  _handleAppStateChange = (nextAppState) => {
    console.log("_handleAppStateChange(): ", nextAppState, this.state.timerStart, this.timeRemaining);
    if (nextAppState != "active" && this.state.timerStart && this.timeRemaining > 0) {
      cancelAllNotifications();
      PushNotification.localNotificationSchedule({
        id: "1337",
        message: "Icing timer for " + ((this.state.timerDurationSeconds / 1000) / 60) + " minutes has finished",
        date: new Date(Date.now() + ((this.timeRemaining + 2) * 1000))
      });
      if (this.canCreateNotifications) {
        createNotification(this.timeRemaining);
      }
    } else if (!this.state.timerStart && this.timerRemaining == 0)  {
      cancelAllNotifications();
      if (this.canCreateNotifications) {
        createNotification(this.timeRemaining);
      }
    } else if (nextAppState == "active" && this.state.timerStart && this.timeRemaining > 0) {
        cancelAllNotifications();
    }

  };

  // Time remaining in seconds
  timeRemaining = this.props.navigation.state.params.timerDuration;

  state = {
    timerStart: false,
    timerDurationSeconds: this.props.navigation.state.params.timerDuration,
    canCreateNotifications: this.props.navigation.state.params.canCreateNotifications,
  };

  timerComplete() {
    this.setState({timerStart: false});

    // Remove all notifications AND
    // Schedule a new notification
    if (this.state.canCreateNotifications) {
      cancelAllNotifications();
      createNotification();
    }

    this.props.navigation.dispatch(NavigationActions.back());
  };

  timerStartOrPause() {
    // Remove all notificatinos AND
    // Schedule a new notification
    if (this.state.canCreateNotifications) {
      cancelAllNotifications();
      if (this.state.timerStart) {
        createNotification();
      }
    }

    this.setState({
      timerStart: !this.state.timerStart,
    });
  };

  getTimeCallback(formattedTime) {
    var splitTime = formattedTime.split(":");
    var minutesLeft = Number(splitTime[1]);
    var secondsLeft = Number(splitTime[2]);

    this.timeRemaining = (minutesLeft * 60) + secondsLeft;
  };

  render() {
    return (
      <View style={styles.timerScreen}>
        <View style={{position: "absolute", top: 30}}>
      <View style={styles.timerScreen}>

      </View>
        <Text style={styles.helpText}> NOTE: Going back a screen will reset the timer</Text>
        </View>
        <Timer
          totalDuration={this.state.timerDurationSeconds} msecs start={this.state.timerStart}
          handleFinish={ () => this.timerComplete() }
          getTime = { (v) => this.getTimeCallback(v) }
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
    width: 250,
    paddingBottom: 30,
  },
  text: {
    fontSize: 30,
    color: "#000",
    marginLeft: 30,
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
    fontSize: 11,
  },
});

export default StackNavigator({
  Home: { screen: HomeScreen },
  Timer: { screen: TimerScreen },
}, { initialRouteName: "Home" });

