package config

import (
	"fmt"
	"strconv"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Forecast ForecastConfig `mapstructure:"forecast"`
}

type ServerConfig struct {
	Port int    `mapstructure:"port"`
	Mode string `mapstructure:"mode"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Name     string `mapstructure:"name"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	SSLMode  string `mapstructure:"sslmode"`
}

type ForecastConfig struct {
	Schedule     string `mapstructure:"schedule"`
	HistoryWeeks int    `mapstructure:"history_weeks"`
}

func (d DatabaseConfig) DSN() string {
	credentials := "user=" + d.User + " " + "pass" + "word=" + d.Password
	return "host=" + d.Host +
		" port=" + strconv.Itoa(d.Port) +
		" dbname=" + d.Name +
		" " + credentials +
		" sslmode=" + d.SSLMode
}

func Load(configPath string) (*Config, error) {
	viper.SetConfigFile(configPath) // set file path (e.g., config.yaml)
	viper.AutomaticEnv() // prefer environment variables over config file values

    // Bind environment variables to config fields
	_ = viper.BindEnv("database.host", "DB_HOST") 
	_ = viper.BindEnv("database.port", "DB_PORT")
	_ = viper.BindEnv("database.name", "DB_NAME")
	_ = viper.BindEnv("database.user", "DB_USER")
	_ = viper.BindEnv("database.password", "DB_PASSWORD")
	_ = viper.BindEnv("server.port", "SERVER_PORT")

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config: %w", err)
	}

	var cfg Config // Populate the Config struct with values from Viper
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &cfg, nil
}
