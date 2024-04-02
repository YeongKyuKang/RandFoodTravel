# Random Food Travel!! (2024.03.14 ~ )
간단하게 웹서비스를 만들어보기.

웹사이트 도메인

CloudType : <https://port-0-randfoodtravel-fi1xh2bltyeh2cq.sel5.cloudtype.app/>

AWS Elastic Beanstalk: <http://RandFoodTravel.ap-northeast-2.elasticbeanstalk.com>

사용 언어: Node.JS, HTML

배포 서비스: AWS Elastic Beanstalk

데이터베이스: MongoDB


2024.03.14 ~ 2024.03.27

전에 AWS를 사용했을 때, 프리티어를 다 사용해서 클라우드 관련 사이트를 알아보던 중 클라우드타입이란 클라우드 서비스가 괜찮다는 말을 듣고 사용했다.

2024.03.27

클라우드타입에 배포한 인스턴스가 새벽 3시부터 9시까지 멈추는 이유 때문에 다른 클라우드 서비스를 찾던 중, AWS Elastic Beanstalk 서비스가 생각보다 간단하고 관리부터 유지보수까지 모두 진행해준다는 것을 알고 사용해서 배포했다. EC2를 사용해서 배포를 해도 되었지만 EC2는 관리해야 하는 것이 많고, 만들다가 잘못 건들면 과금과 오류가 발생할 수 있다 들어서 배제하였다.

2024.03.28

배포까지는 되었으나 https가 아닌 http로 사이트 접근이 되어 geolocation API가 사용되지 않는 오류를 발견했다. aws 서비스에서 https를 자동으로 리다이렉션하려면 Route53을 사용해 진행해야 하는데 현재 DNS를 갖고 있지 않아 Freenom이란 사이트를 사용해 DNS를 받아와 진행하려 했으나 현재 새로운 DNS는 제공하지 않는다는 공지로 인해 진행이 더이상 되지 않는다.

2024.04.02
현재 배포가 된 상태에서 아직 https로 변경을 진행하지 못해 제대로 서비스를 못하고 있는 상호아에서 route53에서 돈이 과금된 것을 확인하였다. AWS Elastics Beanstalk 간편한 대신 요금이 나온다는 얘기를 들었는데 이렇게 되는 것을 알게 되어 일단 서비스를 terminate해놓았다.
