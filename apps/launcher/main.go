// Forge+ desktop launcher.
// Serves the editor (built into this program) on 127.0.0.1 and opens it in its own
// Edge (or Chrome) app window. Closing the window quits the program.
// three.js is downloaded once from cdnjs and kept next to the settings, so the 3D view
// also works offline after the first run.
package main

import (
	_ "embed"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

//go:embed forge.html
var page []byte

const threeURL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"

// A fixed port keeps the same browser origin every run, so the Shapes you load and your
// settings (kept in the browser's storage) are still there next time.
var ports = []int{47811, 47812, 47813}

func dataDir() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		if h, err := os.UserHomeDir(); err == nil {
			base = filepath.Join(h, ".local", "share")
		} else {
			base = os.TempDir()
		}
	}
	d := filepath.Join(base, "ForgePlus")
	os.MkdirAll(d, 0o755)
	return d
}

func logf(format string, a ...any) {
	f, err := os.OpenFile(filepath.Join(dataDir(), "forge.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	defer f.Close()
	fmt.Fprintf(f, time.Now().Format("2006-01-02 15:04:05 ")+format+"\n", a...)
}

func three(w http.ResponseWriter, r *http.Request) {
	cache := filepath.Join(dataDir(), "three.r128.min.js")
	if b, err := os.ReadFile(cache); err == nil && len(b) > 100000 {
		w.Header().Set("Content-Type", "text/javascript")
		w.Write(b)
		return
	}
	c := &http.Client{Timeout: 30 * time.Second}
	resp, err := c.Get(threeURL)
	if err == nil && resp.StatusCode == 200 {
		defer resp.Body.Close()
		b, err := io.ReadAll(resp.Body)
		if err == nil && len(b) > 100000 {
			os.WriteFile(cache, b, 0o644)
			w.Header().Set("Content-Type", "text/javascript")
			w.Write(b)
			return
		}
	}
	logf("three.js download failed: %v", err)
	// Without three.js the 2D editor still works; the 3D view needs it.
	w.Header().Set("Content-Type", "text/javascript")
	w.Write([]byte(`console.warn("Forge+: three.js could not be downloaded; the 3D view needs an internet connection the first time.");`))
}

func listen() (net.Listener, int, error) {
	for _, p := range ports {
		if l, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", p)); err == nil {
			return l, p, nil
		}
	}
	return nil, 0, errors.New("no free port")
}

func main() {
	html := strings.Replace(string(page), threeURL, "/three.min.js", 1)
	mux := http.NewServeMux()
	mux.HandleFunc("/three.min.js", three)
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Write([]byte(html))
	})
	l, port, err := listen()
	if err != nil {
		// Probably already running: open a window on the first port instead.
		logf("listen: %v", err)
		openWindow(fmt.Sprintf("http://127.0.0.1:%d/", ports[0]), false)
		return
	}
	url := fmt.Sprintf("http://127.0.0.1:%d/", port)
	go http.Serve(l, mux)
	logf("serving on %s", url)
	if os.Getenv("FORGEPLUS_NO_WINDOW") != "" {
		select {}
	}
	openWindow(url, true)
}

func findBrowser() string {
	if runtime.GOOS != "windows" {
		return ""
	}
	cands := []string{
		`%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe`,
		`%ProgramFiles%\Microsoft\Edge\Application\msedge.exe`,
		`%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe`,
		`%ProgramFiles%\Google\Chrome\Application\chrome.exe`,
		`%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe`,
		`%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`,
	}
	for _, c := range cands {
		p := os.ExpandEnv(strings.NewReplacer("%ProgramFiles(x86)%", os.Getenv("ProgramFiles(x86)"), "%ProgramFiles%", os.Getenv("ProgramFiles"), "%LOCALAPPDATA%", os.Getenv("LOCALAPPDATA")).Replace(c))
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			return p
		}
	}
	return ""
}

// The window gets its own browser profile, so it runs as its own program (we can tell
// when it closes) and asks where to save each exported map.
func prepareProfile() string {
	prof := filepath.Join(dataDir(), "Window")
	def := filepath.Join(prof, "Default")
	os.MkdirAll(def, 0o755)
	prefs := filepath.Join(def, "Preferences")
	if _, err := os.Stat(prefs); errors.Is(err, os.ErrNotExist) {
		os.WriteFile(prefs, []byte(`{"download":{"prompt_for_download":true},"browser":{"has_seen_welcome_page":true}}`), 0o644)
	}
	return prof
}

func openWindow(url string, wait bool) {
	if b := findBrowser(); b != "" {
		args := []string{"--app=" + url, "--user-data-dir=" + prepareProfile(), "--no-first-run", "--no-default-browser-check", "--window-size=1440,900"}
		cmd := exec.Command(b, args...)
		if err := cmd.Start(); err == nil {
			if wait {
				cmd.Wait()
				// Some browsers hand the window to an already-running copy and exit at once.
				// Keep serving while that window is still talking to us.
				waitIdle()
			}
			return
		} else {
			logf("start browser: %v", err)
		}
	}
	// No Edge or Chrome: use the default browser and keep serving until it goes quiet.
	if runtime.GOOS == "windows" {
		exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	} else {
		fmt.Println("Forge+ is running at", url)
	}
	if wait {
		waitIdle()
	}
}

// Keep running while the page still checks in. The editor page is static, so treat
// a window as open while the profile lock file exists; otherwise give it a generous grace period.
func waitIdle() {
	lock := filepath.Join(dataDir(), "Window", "lockfile")
	time.Sleep(5 * time.Second)
	for {
		if _, err := os.Stat(lock); err != nil {
			// No locked profile (default browser case): keep serving for 12 hours at most.
			if _, err2 := os.Stat(filepath.Join(dataDir(), "Window")); err2 != nil || findBrowser() == "" {
				time.Sleep(12 * time.Hour)
			}
			return
		}
		// Windows keeps "lockfile" while the profile is open; deleting fails while it's in use.
		if err := os.Remove(lock); err == nil {
			return
		}
		time.Sleep(2 * time.Second)
	}
}
