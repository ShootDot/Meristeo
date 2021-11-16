import * as React from "react";
import { ThemeProvider, createTheme, styled } from "@mui/material/styles";
import "./App.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import MuiAppBar from "@mui/material/AppBar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Skeleton from "@mui/material/Skeleton";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import ReplayIcon from "@mui/icons-material/Replay";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Replay10Icon from "@mui/icons-material/Replay10";
import Forward10Icon from "@mui/icons-material/Forward10";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUp from "@mui/icons-material/VolumeUp";
import RepeatOneIcon from "@mui/icons-material/RepeatOne";
import RepeatOneOnIcon from "@mui/icons-material/RepeatOneOn";
const { api } = window;
const drawerWidth = 240;
const ColorModeContext = React.createContext({ toggleColorMode: () => {} });
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

function App() {
  const [searchText, setSearchText] = React.useState("");
  const [finalSearch, setFinalSearch] = React.useState("");
  const [results, setResults] = React.useState(null);
  const [searchLoader, setSearchLoader] = React.useState(false);
  const [audioData, setAudioData] = React.useState(false);
  const [audioPlaing, setAudioPlaying] = React.useState(false);
  const [audioValue, setAudioValue] = React.useState(100);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [paused, setPaused] = React.useState(false);
  const [seek, setSeek] = React.useState(0);
  const [loop, setLoop] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [user, setUser] = React.useState(false);
  const [connecting, setConnecting] = React.useState(true);
  const [duration, setDuration] = React.useState("00:00/00:00");
  const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
  }));

  React.useEffect(() => {
    api.send('rpcConnect')
    api.recieve('rpcFail', (message) => {
      setConnecting(false)
    })
    api.recieve('rpcSuccess', (message) => {
      setUser(message[0])
    })
  }, [])

  function msToTime(s) {
    if (isNaN(s)) {
      let timeString = "00:00";
      return timeString;
    }
    let dateObj = new Date(s * 1000);
    let hours = dateObj.getUTCHours();
    let minutes = dateObj.getUTCMinutes();
    let seconds = dateObj.getSeconds();
    if (hours) {
      let timeString =
        hours.toString().padStart(2, "0") +
        ":" +
        minutes.toString().padStart(2, "0") +
        ":" +
        seconds.toString().padStart(2, "0");
      return timeString;
    } else {
      let timeString =
        minutes.toString().padStart(2, "0") +
        ":" +
        seconds.toString().padStart(2, "0");
      return timeString;
    }
  }

  const search = (e) => {
    e.preventDefault();
    api.send("rpcConnect");
    if (!searchText) return;
    setResults(false);
    api.send("search", searchText);
    setSearchLoader(true);
    api.recieve("results", (message) => {
      setSearchLoader(false);
      setFinalSearch(searchText);
      setResults(message[0]);
    })
  };

  let playing;
  const play = (index) => {
    
    api.send("playUrl", results.items[index].url);
    api.recieve("playUrl", (message) => {
      setAudioData(results.items[index]);
      
      if (playing) {
        let o = playing;
        o.pause();
        setLoop(false);
        o.src = message[0];
      } else {
        let player = new Audio(message[0]);
        playing = player;
        setAudioPlaying(player);
        player.volume = audioValue / 100;
        player.play();
        setIsPlaying(false);
        setPaused(true);
        player.addEventListener("timeupdate", () => {
          let rpc = [];
          rpc = rpc.concat(results.items[index]);
          rpc = rpc.concat(msToTime(player.duration-player.currentTime))
          api.send("rpc", rpc)
          setSeek((player.currentTime / player.duration) * 100);
          setDuration(
            `${msToTime(player.currentTime)}/${msToTime(player.duration)}`
          );
        });
        player.addEventListener("ended", () => {
          api.send("pause")
          setEnded(true);
        });
        player.addEventListener("play", () => {
          setEnded(false);
          setPaused(true);
          player.volume =
            (document.getElementsByTagName("input")[2].value * 1) / 100;
        });
        player.addEventListener("pause", () => {
          api.send("pause")
          setPaused(false);
        })
      }
    });
  };
  const handleSeek = (e) => {
    let o = audioPlaing;
    o.currentTime = (e.target.value / 100) * o.duration;
  };
  const changeVolume = (e) => {
    setAudioValue(e.target.value);
    if (audioPlaing) {
      let o = audioPlaing;
      o.volume = e.target.value / 100;
    }
  };

  const playOrPause = (e) => {
    e.preventDefault();
    if (!paused) {
      let o = audioPlaing;
      o.play();
    } else {
      let o = audioPlaing;
      o.pause();
    }
  };

  const keepLoop = (e) => {
    e.preventDefault();
    if (!loop) {
      let o = audioPlaing;
      o.loop = true;
      setLoop(true);
    } else {
      let o = audioPlaing;
      o.loop = false;
      setLoop(false);
    }
  };

  const reverse10Sec = (e) => {
    e.preventDefault();
    let o = audioPlaing;
    o.currentTime = o.currentTime - 10;
    if (o.paused) return o.play()
  };
  const forward10Sec = (e) => {
    e.preventDefault();
    let o = audioPlaing;
    o.currentTime = o.currentTime + 10;
    if (o.ended) return;
    if (o.paused) return o.play()
  };

  const replayAudio = (e) => {
    e.preventDefault();
    let o = audioPlaing;
    o.currentTime = 0
    o.play()
  }
  return (
    <>
      <div className="App">
        <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <AppBar position="fixed" open={false}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div">
                Meristeo
              </Typography>
              <Button variant="contained" style={{marginLeft: 'auto', textTransform: 'none'}} onClick={() => {
                if (!user){ 
                  api.send('rpcConnect')
                  setConnecting(true)
                }
              }}>
                {!user? <>
              <Typography variant="p">{connecting ? 'Connecting to Discord' : 'Reconnect to Discord'}</Typography>
              </> : <>
              <Avatar src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}></Avatar>
              <Typography variant="p">&nbsp;&nbsp;{user.username}#{user.discriminator}</Typography>
              </>}
              </Button>
            </Toolbar>
          </AppBar>

          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <DrawerHeader />
            <form onSubmit={search}>
              <TextField
                id="searchBar"
                label="Search"
                value={searchText}
                sx={{ width: "50%" }}
                onChange={(newValue) => {
                  setSearchText(newValue.target.value);
                }}
                variant="standard"
              />
              <IconButton
                type="submit"
                sx={{ p: "10px", marginTop: "10px" }}
                aria-label="search"
              >
                <SearchIcon />
              </IconButton>
            </form>
            <Box style={{ maxHeight: "55vh", overflow: "auto" }}>
              <>
                {results ? (
                  <>
                    {results.items.length === 0 ? (
                      <h4 style={{ marginRight: "50px" }}>No Results found</h4>
                    ) : (
                      <>
                        {results.correctedQuery !== finalSearch ? (
                          <>
                            <h4 style={{ marginRight: "50px" }}>
                              {" "}
                              Did you mean{" "}
                              <u
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setSearchText(results.correctedQuery);
                                  setFinalSearch(results.correctedQuery);
                                }}
                              >
                                {results.correctedQuery}
                              </u>
                              ?
                            </h4>
                          </>
                        ) : (
                          ""
                        )}
                      </>
                    )}

                    <List sx={{ margin: "50px" }}>
                      {results.items.map((value, index) => {
                        return (
                          <ListItem
                            key={value.id}
                            secondaryAction={<p>{value.duration}</p>}
                            disablePadding
                            onClick={() => play(index)}
                          >
                            <ListItemButton>
                              <ListItemAvatar>
                                <Avatar
                                  alt={value.title}
                                  src={value.bestThumbnail.url}
                                />
                              </ListItemAvatar>
                              <ListItemText
                                id={value.id}
                                primary={value.title}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </>
                ) : (
                  <List sx={{ margin: "50px" }}>
                    {searchLoader ? (
                      <>
                        {Array.from(Array(10).keys()).map((v) => {
                          return (
                            <ListItem key={v} disablePadding>
                              <ListItemButton disabled>
                                <ListItemAvatar>
                                  <Skeleton
                                    variant="circular"
                                    width={40}
                                    height={40}
                                    animation="wave"
                                  />
                                </ListItemAvatar>
                                <Skeleton width="100%" animation="wave" />
                              </ListItemButton>
                            </ListItem>
                          );
                        })}
                      </>
                    ) : (
                      ""
                    )}
                  </List>
                )}
              </>
            </Box>
          </Box>
        </Box>
      </div>
      <footer className="footer">
        <div id="content">
          <div id="range">
            <Slider
              id="range-val"
              disabled={isPlaying}
              value={seek}
              onChange={handleSeek}
            />
            <div id="tip">
              {audioData ? (
                <>
                  <Typography>{audioData.title}</Typography>
                </>
              ) : (
                <Typography>&zwnj;</Typography>
              )}
            </div>
          </div>
          <div id="time">
            <Typography>{duration}</Typography>
          </div>
          <div id="buttons" style={{ position: "absolute" }}>
            <div id="controls" style={{ marginTop: "1%" }}>
              <IconButton disabled={isPlaying} onClick={reverse10Sec}>
                <Replay10Icon />
              </IconButton>
              {!ended ? (
                <IconButton disabled={isPlaying} onClick={playOrPause}>
                  {paused ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
              ) : (
                <IconButton disabled={isPlaying} onClick={replayAudio}>
                  <ReplayIcon />
                </IconButton>
              )}
              <IconButton disabled={isPlaying} onClick={forward10Sec}>
                <Forward10Icon />
              </IconButton>
              <IconButton disabled={isPlaying} onClick={keepLoop}>
                {!loop ? <RepeatOneIcon /> : <RepeatOneOnIcon />}
              </IconButton>
            </div>
            <div id="volume">
            <Stack
              spacing={1}
              direction="row"
              sx={{ mb: 1 }}
              alignItems="center"
              style={{
                float: "right",
                marginRight: "-120px",
                width: "290px",
                padding: "0",
                marginTop: "-2%",
              }}
            >
              <VolumeUp />
              <Slider
                id="volumeSlider"
                size="small"
                valueLabelDisplay="auto"
                style={{ width: "25%" }}
                aria-label="Volume"
                value={audioValue}
                onChange={changeVolume}
              />
            </Stack>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function ToggleColorMode(color) {
  const [mode, setMode] = React.useState("dark");
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );
  mode === "light"
    ? (document.querySelector('meta[name="theme-color"]').content = "#1976d2")
    : (document.querySelector('meta[name="theme-color"]').content = "#272727");
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}