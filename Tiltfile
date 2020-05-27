print('lfp-appeals-frontend')

local_resource(
  name = 'lfp-appeals-frontend-build',
  cmd = 'npm run build',
  deps = [
    'src'
  ]
)

custom_build(
  ref = '169942020521.dkr.ecr.eu-west-1.amazonaws.com/local/lfp-appeals-frontend',
  command = 'docker build -t $EXPECTED_REF .',
  live_update = [
    sync(
      local_path = './dist',
      remote_path = '/app/dist'
    ),
    restart_container()
  ],
  deps = [
    './dist'
  ]
)

docker_compose(
  configPaths = [
    './docker-compose.yaml',
    './docker-compose.local.yaml'
  ]
)
