<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Default Database Connection Name
    |--------------------------------------------------------------------------
    |
    | Here you may specify which of the database connections below you wish
    | to use as your default connection for database operations. This is
    | the connection which will be utilized unless another connection
    | is explicitly specified when you execute a query / statement.
    |
    */

    'default' => env('DB_CONNECTION', 'sqlite'),

    /*
    |--------------------------------------------------------------------------
    | Database Connections
    |--------------------------------------------------------------------------
    |
    | Below are all of the database connections defined for your application.
    | An example configuration is provided for each database system which
    | is supported by Laravel. You're free to add / remove connections.
    |
    */

    'connections' => [

        'sqlite' => [
            'driver' => 'sqlite',
            'url' => env('DB_URL'),
            'database' => env('DB_DATABASE', database_path('database.sqlite')),
            'prefix' => '',
            'foreign_key_constraints' => env('DB_FOREIGN_KEYS', true),
        ],

        'mysql' => [
            'driver' => 'mysql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        'mariadb' => [
            'driver' => 'mariadb',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'port' => env('DB_PORT', '3306'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'unix_socket' => env('DB_SOCKET', ''),
            'charset' => env('DB_CHARSET', 'utf8mb4'),
            'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
            'prefix' => '',
            'prefix_indexes' => true,
            'strict' => true,
            'engine' => null,
            'options' => extension_loaded('pdo_mysql') ? array_filter([
                PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
            ]) : [],
        ],

        // 'pgsql' => [
        //     'driver' => 'pgsql',
        //     'url' => env('DB_URL'),
        //     'host' => env('DB_HOST', '127.0.0.1'),
        //     'port' => env('DB_PORT', '5432'),
        //     'database' => env('DB_DATABASE', 'laravel'),
        //     'username' => env('DB_USERNAME', 'root'),
        //     'password' => env('DB_PASSWORD', ''),
        //     'charset' => env('DB_CHARSET', 'utf8'),
        //     'prefix' => '',
        //     'prefix_indexes' => true,
        //     'search_path' => 'public',
        //     'sslmode' => 'prefer',
        // ],
        
        #default db_system
        'pgsql' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', '127.0.0.1'),
            'read' => [
                'host' => [
                    env('DB_READ_HOST', env('DB_HOST', '127.0.0.1')),
                ],
                'port' => env('DB_READ_PORT', env('DB_PORT', '5432')),
                'database' => env('DB_READ_DATABASE', env('DB_DATABASE', 'laravel')),
                'username' => env('DB_READ_USERNAME', env('DB_USERNAME', 'postgres')),
                "password" => env('DB_READ_PASSWORD', env('DB_PASSWORD', 'root')),
            ],
            'write' => [
                'host' => env('DB_HOST', '127.0.0.1'),
            ],
            'port' => env('DB_PORT', '5432'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],

        #default db_property
        'pgsql_property' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_PROPERTY_HOST', '127.0.0.1'),
            'read' => [
                'host' => [
                    env('DB_PROPERTY_READ_HOST', env('DB_PROPERTY_HOST', '127.0.0.1')),
                ],
                'port' => env('DB_PROPERTY_READ_PORT', env('DB_PROPERTY_PORT', '5432')),
                'database' => env('DB_PROPERTY_READ_DATABASE', env('DB_PROPERTY_DATABASE', 'laravel')),
                'username' => env('DB_PROPERTY_READ_USERNAME', env('DB_PROPERTY_USERNAME', 'postgres')),
                "password" => env('DB_PROPERTY_READ_PASSWORD', env('DB_PROPERTY_PASSWORD', 'root')),
            ],
            'write' => [
                'host' => env('DB_PROPERTY_HOST', '127.0.0.1'),
            ],
            'port' => env('DB_PROPERTY_PORT', '5432'),
            'database' => env('DB_PROPERTY_DATABASE', 'laravel'),
            'username' => env('DB_PROPERTY_USERNAME', 'root'),
            'password' => env('DB_PROPERTY_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],
        'pgsql_water' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_WATER_HOST', '127.0.0.1'),
            'read' => [
                'host' => [
                    env('DB_WATER_READ_HOST', env('DB_WATER_HOST', '127.0.0.1')),
                ],
                'port' => env('DB_WATER_READ_PORT', env('DB_WATER_PORT', '5432')),
                'database' => env('DB_WATER_READ_DATABASE', env('DB_WATER_DATABASE', 'laravel')),
                'username' => env('DB_WATER_READ_USERNAME', env('DB_WATER_USERNAME', 'postgres')),
                "password" => env('DB_WATER_READ_PASSWORD', env('DB_WATER_PASSWORD', 'root')),
            ],
            'write' => [
                'host' => env('DB_WATER_HOST', '127.0.0.1'),
            ],
            'port' => env('DB_WATER_PORT', '5432'),
            'database' => env('DB_WATER_DATABASE', 'laravel'),
            'username' => env('DB_WATER_USERNAME', 'root'),
            'password' => env('DB_WATER_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],
        'pgsql_trade' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_TRADE_HOST', '127.0.0.1'),
            'read' => [
                'host' => [
                    env('DB_TRADE_READ_HOST', env('DB_TRADE_HOST', '127.0.0.1')),
                ],
                'port' => env('DB_TRADE_READ_PORT', env('DB_TRADE_PORT', '5432')),
                'database' => env('DB_TRADE_READ_DATABASE', env('DB_TRADE_DATABASE', 'laravel')),
                'username' => env('DB_TRADE_READ_USERNAME', env('DB_TRADE_USERNAME', 'postgres')),
                "password" => env('DB_TRADE_READ_PASSWORD', env('DB_TRADE_PASSWORD', 'root')),
            ],
            'write' => [
                'host' => env('DB_TRADE_HOST', '127.0.0.1'),
            ],
            'port' => env('DB_TRADE_PORT', '5432'),
            'database' => env('DB_TRADE_DATABASE', 'laravel'),
            'username' => env('DB_TRADE_USERNAME', 'root'),
            'password' => env('DB_TRADE_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],
        // DMC 
        'pgsql_dmc_property' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_DMC_PROPERTY_HOST', '127.0.0.1'),
            'read' => [
                'host' => [
                    env('DB_DMC_PROPERTY_READ_HOST', env('DB_DMC_PROPERTY_HOST', '127.0.0.1')),
                ],
                'port' => env('DB_DMC_PROPERTY_READ_PORT', env('DB_DMC_PROPERTY_PORT', '5432')),
                'database' => env('DB_DMC_PROPERTY_READ_DATABASE', env('DB_DMC_PROPERTY_DATABASE', 'laravel')),
                'username' => env('DB_DMC_PROPERTY_READ_USERNAME', env('DB_DMC_PROPERTY_USERNAME', 'postgres')),
                "password" => env('DB_DMC_PROPERTY_READ_PASSWORD', env('DB_DMC_PROPERTY_PASSWORD', 'root')),
            ],
            'write' => [
                'host' => env('DB_DMC_PROPERTY_HOST', '127.0.0.1'),
            ],
            'port' => env('DB_DMC_PROPERTY_PORT', '5432'),
            'database' => env('DB_DMC_PROPERTY_DATABASE', 'laravel'),
            'username' => env('DB_DMC_PROPERTY_USERNAME', 'root'),
            'password' => env('DB_DMC_PROPERTY_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],

        'pgsql_dmc_water' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_DMC_WATER_HOST', '127.0.0.1'),
            'read' => [
                'host' => [
                    env('DB_DMC_WATER_READ_HOST', env('DB_DMC_WATER_HOST', '127.0.0.1')),
                ],
                'port' => env('DB_DMC_WATER_READ_PORT', env('DB_DMC_WATER_PORT', '5432')),
                'database' => env('DB_DMC_WATER_READ_DATABASE', env('DB_DMC_WATER_DATABASE', 'laravel')),
                'username' => env('DB_DMC_WATER_READ_USERNAME', env('DB_DMC_WATER_USERNAME', 'postgres')),
                "password" => env('DB_DMC_WATER_READ_PASSWORD', env('DB_DMC_WATER_PASSWORD', 'root')),
            ],
            'write' => [
                'host' => env('DB_DMC_WATER_HOST', '127.0.0.1'),
            ],
            'port' => env('DB_DMC_WATER_PORT', '5432'),
            'database' => env('DB_DMC_WATER_DATABASE', 'laravel'),
            'username' => env('DB_DMC_WATER_USERNAME', 'root'),
            'password' => env('DB_DMC_WATER_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],

        'pgsql_dmc_trade' => [
            'driver' => 'pgsql',
            'url' => env('DB_URL'),
            'host' => env('DB_DMC_TRADE_HOST', '127.0.0.1'),
            'read' => [
                'host' => [
                    env('DB_DMC_TRADE_READ_HOST', env('DB_DMC_TRADE_HOST', '127.0.0.1')),
                ],
                'port' => env('DB_DMC_TRADE_READ_PORT', env('DB_DMC_TRADE_PORT', '5432')),
                'database' => env('DB_DMC_TRADE_READ_DATABASE', env('DB_DMC_TRADE_DATABASE', 'laravel')),
                'username' => env('DB_DMC_TRADE_READ_USERNAME', env('DB_DMC_TRADE_USERNAME', 'postgres')),
                "password" => env('DB_DMC_TRADE_READ_PASSWORD', env('DB_DMC_TRADE_PASSWORD', 'root')),
            ],
            'write' => [
                'host' => env('DB_DMC_TRADE_HOST', '127.0.0.1'),
            ],
            'port' => env('DB_DMC_TRADE_PORT', '5432'),
            'database' => env('DB_DMC_TRADE_DATABASE', 'laravel'),
            'username' => env('DB_DMC_TRADE_USERNAME', 'root'),
            'password' => env('DB_DMC_TRADE_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            'search_path' => 'public',
            'sslmode' => 'prefer',
        ],

        'sqlsrv' => [
            'driver' => 'sqlsrv',
            'url' => env('DB_URL'),
            'host' => env('DB_HOST', 'localhost'),
            'port' => env('DB_PORT', '1433'),
            'database' => env('DB_DATABASE', 'laravel'),
            'username' => env('DB_USERNAME', 'root'),
            'password' => env('DB_PASSWORD', ''),
            'charset' => env('DB_CHARSET', 'utf8'),
            'prefix' => '',
            'prefix_indexes' => true,
            // 'encrypt' => env('DB_ENCRYPT', 'yes'),
            // 'trust_server_certificate' => env('DB_TRUST_SERVER_CERTIFICATE', 'false'),
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Migration Repository Table
    |--------------------------------------------------------------------------
    |
    | This table keeps track of all the migrations that have already run for
    | your application. Using this information, we can determine which of
    | the migrations on disk haven't actually been run on the database.
    |
    */

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Redis Databases
    |--------------------------------------------------------------------------
    |
    | Redis is an open source, fast, and advanced key-value store that also
    | provides a richer body of commands than a typical key-value system
    | such as Memcached. You may define your connection settings here.
    |
    */

    'redis' => [

        'client' => env('REDIS_CLIENT', 'phpredis'),

        'options' => [
            'cluster' => env('REDIS_CLUSTER', 'redis'),
            'prefix' => env('REDIS_PREFIX', Str::slug(env('APP_NAME', 'laravel'), '_').'_database_'),
        ],

        'default' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_DB', '0'),
        ],

        'cache' => [
            'url' => env('REDIS_URL'),
            'host' => env('REDIS_HOST', '127.0.0.1'),
            'username' => env('REDIS_USERNAME'),
            'password' => env('REDIS_PASSWORD'),
            'port' => env('REDIS_PORT', '6379'),
            'database' => env('REDIS_CACHE_DB', '1'),
        ],

    ],

];
